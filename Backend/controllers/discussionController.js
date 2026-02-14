const Discussion = require('../models/Discussion');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Notification = require('../models/Notification');

// Helper to check if user is course instructor
const isCourseInstructor = async (courseId, userId) => {
    const course = await Course.findById(courseId);
    return course && course.instructorID.toString() === userId.toString();
};

// Get all discussions for a course
exports.getCourseDiscussions = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { search } = req.query;

        let query = { courseID: courseId };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        const discussions = await Discussion.find(query)
            .populate('authorID', 'name profileImage role')
            .populate('replies.authorID', 'name profileImage role')
            .sort({ isPinned: -1, lastActivity: -1 });

        res.json({ success: true, discussions });
    } catch (error) {
        console.error('Error fetching discussions:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Create a new discussion
exports.createDiscussion = async (req, res) => {
    try {
        const { title, content, courseID } = req.body;
        const authorID = req.user.id;

        // Verify enrollment if student
        if (req.user.role === 'student') {
            const enrollment = await Enrollment.findOne({ studentID: authorID, courseID });
            if (!enrollment) {
                return res.status(403).json({ success: false, message: 'You must be enrolled to start a discussion' });
            }
        } else if (req.user.role === 'instructor') {
            const isOwner = await isCourseInstructor(courseID, authorID);
            if (!isOwner) {
                return res.status(403).json({ success: false, message: 'You can only start discussions in your own courses' });
            }
        }

        const newDiscussion = new Discussion({
            title,
            content,
            courseID,
            authorID
        });

        await newDiscussion.save();

        // Notify Instructor if a student starts a thread
        if (req.user.role === 'student') {
            const course = await Course.findById(courseID);
            if (course) {
                await Notification.create({
                    recipientID: course.instructorID,
                    senderID: authorID,
                    type: 'NEW_THREAD',
                    title: 'New Discussion Thread',
                    message: `${req.user.name} started a new discussion: "${title}"`,
                    link: `/instructor/discussions?courseId=${courseID}`,
                    courseID
                });
            }
        }

        res.status(201).json({ success: true, discussion: newDiscussion });
    } catch (error) {
        console.error('Error creating discussion:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Add a reply to a discussion
exports.addReply = async (req, res) => {
    try {
        const { discussionId } = req.params;
        const { content } = req.body;
        const authorID = req.user.id;

        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            return res.status(404).json({ success: false, message: 'Discussion not found' });
        }

        // State Check: No replies on CLOSED threads
        if (discussion.status === 'CLOSED') {
            return res.status(403).json({ success: false, message: 'This discussion is closed for new replies' });
        }

        // State Check: Only instructor can reply to RESOLVED threads
        if (discussion.status === 'RESOLVED') {
            const isOwner = await isCourseInstructor(discussion.courseID, authorID);
            if (!isOwner && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Only instructors can follow up on resolved discussions' });
            }
        }

        discussion.replies.push({ authorID, content });
        discussion.lastActivity = Date.now();
        
        // Mark as hot if many replies
        if (discussion.replies.length > 10) {
            discussion.isHot = true;
        }

        await discussion.save();

        // Notify Thread Author
        if (discussion.authorID.toString() !== authorID.toString()) {
            await Notification.create({
                recipientID: discussion.authorID,
                senderID: authorID,
                type: 'NEW_REPLY',
                title: 'New Reply to your Thread',
                message: `${req.user.name} replied to your discussion: "${discussion.title}"`,
                link: `/student/discussions?courseId=${discussion.courseID}`,
                courseID: discussion.courseID
            });
        }

        // Notify Instructor if they are not the one replying
        const course = await Course.findById(discussion.courseID);
        if (course && course.instructorID.toString() !== authorID.toString() && course.instructorID.toString() !== discussion.authorID.toString()) {
            await Notification.create({
                recipientID: course.instructorID,
                senderID: authorID,
                type: 'NEW_REPLY',
                title: 'New Reply in Course',
                message: `${req.user.name} replied in "${discussion.title}"`,
                link: `/instructor/discussions?courseId=${discussion.courseID}`,
                courseID: discussion.courseID
            });
        }

        res.json({ success: true, discussion });
    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update discussion status (OPEN, RESOLVED, CLOSED)
exports.updateStatus = async (req, res) => {
    try {
        const { discussionId } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        const discussion = await Discussion.findById(discussionId);
        if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found' });

        const isOwner = await isCourseInstructor(discussion.courseID, userId);
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized to change status' });
        }

        discussion.status = status;
        await discussion.save();
        res.json({ success: true, discussion });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Mark a reply as the accepted answer
exports.markAcceptedAnswer = async (req, res) => {
    try {
        const { discussionId, replyId } = req.params;
        const userId = req.user.id;

        const discussion = await Discussion.findById(discussionId);
        if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found' });

        const isOwner = await isCourseInstructor(discussion.courseID, userId);
        if (!isOwner) return res.status(403).json({ success: false, message: 'Only instructors can accept answers' });

        discussion.acceptedAnswerId = replyId;
        discussion.status = 'RESOLVED';
        await discussion.save();

        // Notify Reply Author
        const reply = discussion.replies.id(replyId);
        if (reply && reply.authorID.toString() !== userId.toString()) {
            await Notification.create({
                recipientID: reply.authorID,
                senderID: userId,
                type: 'ACCEPTED_ANSWER',
                title: 'Your Answer was Accepted!',
                message: `The instructor marked your reply as the accepted answer in "${discussion.title}"`,
                link: `/student/discussions?courseId=${discussion.courseID}`,
                courseID: discussion.courseID
            });
        }

        res.json({ success: true, discussion });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Toggle Pin
exports.togglePin = async (req, res) => {
    try {
        const { discussionId } = req.params;
        const userId = req.user.id;

        const discussion = await Discussion.findById(discussionId);
        const isOwner = await isCourseInstructor(discussion.courseID, userId);
        if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized' });

        discussion.isPinned = !discussion.isPinned;
        await discussion.save();
        res.json({ success: true, isPinned: discussion.isPinned });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Toggle Helpful on a reply
exports.toggleHelpful = async (req, res) => {
    try {
        const { discussionId, replyId } = req.params;
        const userId = req.user.id;

        const discussion = await Discussion.findById(discussionId);
        const reply = discussion.replies.id(replyId);
        
        if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });
        if (reply.authorID.toString() === userId.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot upvote your own post' });
        }

        const index = reply.isHelpful.indexOf(userId);
        if (index === -1) {
            reply.isHelpful.push(userId);
        } else {
            reply.isHelpful.splice(index, 1);
        }

        await discussion.save();
        res.json({ success: true, helpfulCount: reply.isHelpful.length });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Toggle Instructor Endorsement on a reply
exports.toggleEndorsement = async (req, res) => {
    try {
        const { discussionId, replyId } = req.params;
        const userId = req.user.id;

        const discussion = await Discussion.findById(discussionId);
        if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found' });

        const isOwner = await isCourseInstructor(discussion.courseID, userId);
        if (!isOwner) return res.status(403).json({ success: false, message: 'Only instructors can endorse replies' });

        const reply = discussion.replies.id(replyId);
        if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });

        reply.isInstructorEndorsed = !reply.isInstructorEndorsed;
        await discussion.save();

        // Notify Reply Author if endorsed
        if (reply.isInstructorEndorsed && reply.authorID.toString() !== userId.toString()) {
            await Notification.create({
                recipientID: reply.authorID,
                senderID: userId,
                type: 'ENDORSEMENT',
                title: 'Reply Endorsed',
                message: `The instructor endorsed your reply in "${discussion.title}"`,
                link: `/student/discussions?courseId=${discussion.courseID}`,
                courseID: discussion.courseID
            });
        }

        res.json({ success: true, isInstructorEndorsed: reply.isInstructorEndorsed });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete a discussion or reply (Moderation)
exports.deletePost = async (req, res) => {
    try {
        const { discussionId, replyId } = req.params;
        const userId = req.user.id;

        const discussion = await Discussion.findById(discussionId);
        if (!discussion) return res.status(404).json({ success: false, message: 'Discussion not found' });

        const isOwner = await isCourseInstructor(discussion.courseID, userId);
        const isAdmin = req.user.role === 'admin';

        if (replyId) {
            // Deleting a reply
            const reply = discussion.replies.id(replyId);
            if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });

            // Check permission: Author, Instructor, or Admin
            if (reply.authorID.toString() !== userId.toString() && !isOwner && !isAdmin) {
                return res.status(403).json({ success: false, message: 'Unauthorized to delete this reply' });
            }

            reply.remove();
            await discussion.save();
            return res.json({ success: true, message: 'Reply deleted' });
        } else {
            // Deleting the whole thread
            // Check permission: Author, Instructor, or Admin
            if (discussion.authorID.toString() !== userId.toString() && !isOwner && !isAdmin) {
                return res.status(403).json({ success: false, message: 'Unauthorized to delete this discussion' });
            }

            await discussion.remove();
            return res.json({ success: true, message: 'Discussion deleted' });
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Like/Unlike a discussion
exports.toggleLike = async (req, res) => {
    try {
        const { discussionId } = req.params;
        const userID = req.user.id;

        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            return res.status(404).json({ success: false, message: 'Discussion not found' });
        }

        const likeIndex = discussion.likes.indexOf(userID);
        if (likeIndex === -1) {
            discussion.likes.push(userID);
        } else {
            discussion.likes.splice(likeIndex, 1);
        }

        await discussion.save();
        res.json({ success: true, likes: discussion.likes.length });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
