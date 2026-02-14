const Module = require('../models/Module');
const CourseContent = require('../models/CourseContent');
const Course = require('../models/Course');

// Create module
exports.createModule = async (req, res) => {
    try {
        const { name, courseID, description } = req.body;

        if (!name || !courseID) {
            return res.status(400).json({ success: false, message: 'Name and course ID are required' });
        }

        // Verify instructor owns the course
        const course = await Course.findOne({ _id: courseID, instructorID: req.user.id });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found or unauthorized' });
        }

        // Get next order number
        const maxOrder = await Module.findOne({ courseID }).sort({ order: -1 }).select('order');
        const nextOrder = maxOrder ? maxOrder.order + 1 : 1;

        const newModule = new Module({
            name,
            courseID,
            description,
            order: nextOrder
        });

        await newModule.save();

        res.status(201).json({ success: true, module: newModule, message: 'Module created successfully' });
    } catch (error) {
        console.error('Error creating module:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get modules for a course
exports.getCourseModules = async (req, res) => {
    try {
        const { courseId } = req.params;

        const modules = await Module.find({ courseID: courseId }).sort({ order: 1 });

        res.json({ success: true, modules });
    } catch (error) {
        console.error('Error fetching modules:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update module
exports.updateModule = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const updates = req.body;

        const module = await Module.findByIdAndUpdate(
            moduleId,
            updates,
            { new: true, runValidators: true }
        );

        if (!module) {
            return res.status(404).json({ success: false, message: 'Module not found' });
        }

        res.json({ success: true, module, message: 'Module updated successfully' });
    } catch (error) {
        console.error('Error updating module:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete module
exports.deleteModule = async (req, res) => {
    try {
        const { moduleId } = req.params;

        const module = await Module.findById(moduleId);
        if (!module) {
            return res.status(404).json({ success: false, message: 'Module not found' });
        }

        // 1. Delete all CourseContent linked to this module
        await CourseContent.deleteMany({ moduleID: moduleId });

        // 2. Delete all Quizzes linked to this module
        // We need to require Quiz model first
        const Quiz = require('../models/Quiz');
        await Quiz.deleteMany({ moduleID: moduleId });

        // 3. Delete all Student Progress linked to this module
        const Progress = require('../models/Progress');
        await Progress.deleteMany({ moduleID: moduleId });

        // 4. Finally, delete the module itself
        await module.deleteOne();

        res.json({ success: true, message: 'Module and all associated content permanently deleted' });
    } catch (error) {
        console.error('Error deleting module:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
