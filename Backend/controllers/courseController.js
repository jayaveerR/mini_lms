const Course = require('../models/Course');
const Module = require('../models/Module');
const CourseContent = require('../models/CourseContent');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');

// Get all courses for instructor
exports.getInstructorCourses = async (req, res) => {
    try {
        const instructorID = req.user.id;

        const courses = await Course.find({ instructorID }).sort({ createdAt: -1 });

        // Get enrollment counts for each course
        const coursesWithStats = await Promise.all(
            courses.map(async (course) => {
                const enrollmentCount = await Enrollment.countDocuments({ courseID: course._id });
                const moduleCount = await Module.countDocuments({ courseID: course._id });
                const quizCount = await Quiz.countDocuments({ courseID: course._id });

                return {
                    ...course.toObject(),
                    enrollmentCount,
                    moduleCount,
                    quizCount
                };
            })
        );

        res.json({ success: true, courses: coursesWithStats });
    } catch (error) {
        console.error('Error fetching instructor courses:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Create new course
exports.createCourse = async (req, res) => {
    try {
        const { title, description, category, thumbnail, visibility, enrollmentLimit } = req.body;
        const instructorID = req.user.id;

        if (!title || !description || !category) {
            return res.status(400).json({ success: false, message: 'Title, description, and category are required' });
        }

        const newCourse = new Course({
            title,
            description,
            category,
            thumbnail,
            visibility,
            enrollmentLimit,
            instructorID,
            status: 'draft'
        });

        await newCourse.save();

        res.status(201).json({ success: true, course: newCourse, message: 'Course created successfully' });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get single course by ID
exports.getCourseById = async (req, res) => {
    try {
        const { courseId } = req.params;
        const instructorID = req.user.id;

        const course = await Course.findOne({ _id: courseId, instructorID });

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Get modules with content
        const modules = await Module.find({ courseID: courseId }).sort({ order: 1 });
        const modulesWithContent = await Promise.all(
            modules.map(async (module) => {
                const contents = await CourseContent.find({ moduleID: module._id }).sort({ order: 1 }).populate('quizID');
                return {
                    ...module.toObject(),
                    contents
                };
            })
        );

        res.json({ success: true, course, modules: modulesWithContent });
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update course
exports.updateCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const updates = req.body;
        const instructorID = req.user.id;

        const course = await Course.findOneAndUpdate(
            { _id: courseId, instructorID },
            { ...updates, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.json({ success: true, course, message: 'Course updated successfully' });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Publish course
exports.publishCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const instructorID = req.user.id;

        // Validate course has required content
        const moduleCount = await Module.countDocuments({ courseID: courseId });
        if (moduleCount === 0) {
            return res.status(400).json({ success: false, message: 'Course must have at least one module' });
        }

        const modules = await Module.find({ courseID: courseId });
        for (const module of modules) {
            const contentCount = await CourseContent.countDocuments({ moduleID: module._id });
            if (contentCount === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Module "${module.name}" must have at least one content item`
                });
            }
            // Quiz check removed to support optional quizzes
        }

        const course = await Course.findOneAndUpdate(
            { _id: courseId, instructorID },
            { status: 'published', updatedAt: Date.now() },
            { new: true }
        );

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.json({ success: true, course, message: 'Course published successfully' });
    } catch (error) {
        console.error('Error publishing course:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Unpublish course
exports.unpublishCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const instructorID = req.user.id;

        // Check for active enrollments
        const enrollmentCount = await Enrollment.countDocuments({ courseID: courseId, status: 'active' });
        if (enrollmentCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot unpublish course with active student enrollments'
            });
        }

        const course = await Course.findOneAndUpdate(
            { _id: courseId, instructorID },
            { status: 'draft', updatedAt: Date.now() },
            { new: true }
        );

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.json({ success: true, course, message: 'Course unpublished successfully' });
    } catch (error) {
        console.error('Error unpublishing course:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete course (Soft Delete / Permanent Delete)
exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const instructorID = req.user.id;
        const { permanent } = req.query; // Check for ?permanent=true

        const course = await Course.findOne({ _id: courseId, instructorID });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Soft Delete: Move to 'archived'
        if (String(permanent) !== 'true') {
            const enrollmentCount = await Enrollment.countDocuments({ courseID: courseId });
            if (enrollmentCount > 0) {
                // Even for archive, maybe we warn? But archiving usually allowed. 
                // Let's allow archiving active courses (effectively hiding them but keeping data).
                // User request "delete then permanently delete" implies Archive -> Delete.
            }

            course.status = 'archived';
            await course.save();
            return res.json({ success: true, message: 'Course moved to trash (archived)', course });
        }

        // Permanent Delete
        // Only allow permanent deletion if already archived or draft with no enrollments
        if (course.status !== 'archived' && course.status !== 'draft') {
            // If trying to force delete a published course, restrict it?
            // Use "Delete" (Archive) first.
            // But if user forces via API, we can check enrollments.
        }

        const enrollmentCount = await Enrollment.countDocuments({ courseID: courseId });
        if (enrollmentCount > 0) {
            return res.status(400).json({ success: false, message: 'Cannot permanently delete course with enrollments' });
        }

        // Cascade Delete
        await Module.deleteMany({ courseID: courseId });
        await CourseContent.deleteMany({ courseID: courseId });
        await Quiz.deleteMany({ courseID: courseId });
        await course.deleteOne();

        res.json({ success: true, message: 'Course permanently deleted' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
