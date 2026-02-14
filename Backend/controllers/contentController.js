const CourseContent = require('../models/CourseContent');
const Course = require('../models/Course');
const Module = require('../models/Module');

// Create content
exports.createContent = async (req, res) => {
    try {
        const {
            title,
            courseID,
            moduleID,
            contentType,
            videoURL,
            duration,
            description,
            quizID
        } = req.body;

        if (!title || !courseID || !moduleID || !contentType) {
            return res.status(400).json({
                success: false,
                message: 'Title, course ID, module ID, and content type are required'
            });
        }

        // Verify instructor owns the course
        const course = await Course.findOne({ _id: courseID, instructorID: req.user.id });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found or unauthorized' });
        }

        // Verify module exists
        const module = await Module.findOne({ _id: moduleID, courseID });
        if (!module) {
            return res.status(404).json({ success: false, message: 'Module not found' });
        }

        // Video content must have quiz
        if (contentType === 'video' && !quizID) {
            return res.status(400).json({ success: false, message: 'Video content must have an associated quiz' });
        }

        // Get next order number for module
        const maxOrder = await CourseContent.findOne({ moduleID }).sort({ order: -1 }).select('order');
        const nextOrder = maxOrder ? maxOrder.order + 1 : 1;

        const newContent = new CourseContent({
            title,
            courseID,
            moduleID,
            instructorID: req.user.id,
            contentType,
            videoURL,
            duration,
            description,
            order: nextOrder,
            quizID
        });

        await newContent.save();

        // Populate quiz data
        await newContent.populate('quizID');

        res.status(201).json({ success: true, content: newContent, message: 'Content created successfully' });
    } catch (error) {
        console.error('Error creating content:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get content for module
exports.getModuleContent = async (req, res) => {
    try {
        const { moduleId } = req.params;

        const contents = await CourseContent.find({ moduleID: moduleId })
            .sort({ order: 1 })
            .populate('quizID');

        res.json({ success: true, contents });
    } catch (error) {
        console.error('Error fetching module content:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update content
exports.updateContent = async (req, res) => {
    try {
        const { contentId } = req.params;
        const updates = req.body;

        const content = await CourseContent.findOneAndUpdate(
            { _id: contentId, instructorID: req.user.id },
            updates,
            { new: true, runValidators: true }
        ).populate('quizID');

        if (!content) {
            return res.status(404).json({ success: false, message: 'Content not found' });
        }

        res.json({ success: true, content, message: 'Content updated successfully' });
    } catch (error) {
        console.error('Error updating content:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete content
exports.deleteContent = async (req, res) => {
    try {
        const { contentId } = req.params;

        const content = await CourseContent.findOneAndDelete({
            _id: contentId,
            instructorID: req.user.id
        });

        if (!content) {
            return res.status(404).json({ success: false, message: 'Content not found' });
        }

        res.json({ success: true, message: 'Content deleted successfully' });
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
