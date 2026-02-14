const Progress = require('../models/Progress');
const Enrollment = require('../models/Enrollment');
const CourseContent = require('../models/CourseContent');
const ActivityLog = require('../models/ActivityLog');

// Mark video as completed
exports.markVideoCompleted = async (req, res) => {
    try {
        const { courseId, moduleId, contentId } = req.body;
        const studentId = req.user.id;

        if (!courseId || !moduleId || !contentId) {
            return res.status(400).json({ success: false, message: 'Missing required IDs' });
        }

        // Verify Enrollment
        const enrollment = await Enrollment.findOne({ studentID: studentId, courseID: courseId });
        if (!enrollment) {
            return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
        }

        // Verify Content Exists and is Video
        const content = await CourseContent.findById(contentId);
        if (!content || content.contentType !== 'video') {
            return res.status(400).json({ success: false, message: 'Invalid video content' });
        }

        // Update Progress
        const progress = await Progress.findOneAndUpdate(
            { studentID: studentId, contentID: contentId },
            {
                studentID: studentId,
                courseID: courseId,
                moduleID: moduleId,
                contentID: contentId,
                contentType: 'video',
                status: 'completed',
                completedAt: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Log activity
        await ActivityLog.create({
            userID: studentId,
            activityType: 'video_completed',
            courseID: courseId,
            moduleID: moduleId,
            contentID: contentId
        });

        // Sync with Enrollment.completedItems (for easier stats calculation later)
        if (!enrollment.completedItems.includes(contentId)) {
            enrollment.completedItems.push(contentId);
            enrollment.lastActivity = new Date();
            await enrollment.save();
            
            // Update overall progress percentage
            await exports.updateEnrollmentProgress(studentId, courseId);
        }

        res.json({ success: true, message: 'Video completion recorded', progress });
    } catch (error) {
        console.error('Error recording video completion:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Helper to update enrollment progress percentage
exports.updateEnrollmentProgress = async (studentId, courseId) => {
    try {
        const enrollment = await Enrollment.findOne({ studentID: studentId, courseID: courseId });
        if (!enrollment) return;

        // Count total steps: each CourseContent is a step, and if it has a quiz, that's another step
        const contents = await CourseContent.find({ courseID: courseId });
        let totalSteps = 0;
        contents.forEach(c => {
            totalSteps += 1; // The content itself (video/notes)
            if (c.quizID) totalSteps += 1; // The associated quiz
        });

        if (totalSteps === 0) return;

        // Count completed steps from Progress model
        const completedCount = await Progress.countDocuments({
            studentID: studentId,
            courseID: courseId,
            status: 'completed'
        });

        const progressPercentage = Math.min(Math.round((completedCount / totalSteps) * 100), 100);

        await Enrollment.findOneAndUpdate(
            { studentID: studentId, courseID: courseId },
            { 
                progressPercentage,
                lastActivity: new Date(),
                status: progressPercentage === 100 ? 'completed' : 'active'
            }
        );
    } catch (error) {
        console.error('Error updating enrollment progress:', error);
    }
};

// Get progress for a specific course (used to determine locks)
exports.getCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        const progressdata = await Progress.find({
            studentID: studentId,
            courseID: courseId
        });

        // Return list of completed content IDs
        const completedContentIds = progressdata
            .filter(p => p.status === 'completed')
            .map(p => p.contentID);

        res.json({ success: true, completedContentIds });
    } catch (error) {
        console.error('Error fetching course progress:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// Manually complete course
exports.completeCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const studentId = req.user.id;

        const enrollment = await Enrollment.findOne({ studentID: studentId, courseID: courseId });
        if (!enrollment) {
            return res.status(404).json({ success: false, message: 'Enrollment not found' });
        }

        enrollment.progressPercentage = 100;
        enrollment.status = 'completed';
        enrollment.lastActivity = new Date();
        await enrollment.save();

        res.json({ success: true, message: 'Course marked as completed' });
    } catch (error) {
        console.error('Error completing course:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Reset course progress (Re-attempt)
exports.resetCourseProgress = async (req, res) => {
    try {
        const { courseId } = req.body;
        const studentId = req.user.id;

        // Delete all progress records for this course
        await Progress.deleteMany({ studentID: studentId, courseID: courseId });

        // Reset enrollment
        await Enrollment.findOneAndUpdate(
            { studentID: studentId, courseID: courseId },
            {
                progressPercentage: 0,
                completedItems: [],
                status: 'active',
                lastActivity: new Date()
            }
        );

        res.json({ success: true, message: 'Course progress reset successfully' });
    } catch (error) {
        console.error('Error resetting course progress:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
