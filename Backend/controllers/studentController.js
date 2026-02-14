const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Module = require('../models/Module');
const CourseContent = require('../models/CourseContent');
const ActivityLog = require('../models/ActivityLog');

// Get all published courses (for Explore/Catalog)
exports.getAllCourses = async (req, res) => {
    try {
        const { category, search } = req.query;
        const query = { status: 'published' }; // Only show published courses

        if (category && category !== 'All') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const courses = await Course.find(query)
            .populate('instructorID', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, courses });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Enroll in a course
exports.enrollCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        // Verify course exists and is published
        const course = await Course.findOne({ _id: courseId, status: 'published' });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found or not available' });
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            studentID: studentId,
            courseID: courseId
        });

        if (existingEnrollment) {
            return res.status(400).json({ success: false, message: 'You are already enrolled in this course' });
        }

        // Create enrollment
        const newEnrollment = new Enrollment({
            studentID: studentId,
            courseID: courseId,
            status: 'active',
            progressPercentage: 0,
            enrolledAt: new Date()
        });

        await newEnrollment.save();

        // Log activity
        await ActivityLog.create({
            userID: studentId,
            activityType: 'course_enrolled',
            courseID: courseId
        });

        res.status(201).json({
            success: true,
            message: 'Successfully enrolled in course',
            enrollment: newEnrollment
        });

    } catch (error) {
        console.error('Error enrolling in course:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get authenticated student's enrolled courses
exports.getEnrolledCourses = async (req, res) => {
    try {
        const studentId = req.user.id;

        const enrollments = await Enrollment.find({ studentID: studentId })
            .populate({
                path: 'courseID',
                select: 'title description thumbnail category instructorID status',
                populate: {
                    path: 'instructorID',
                    select: 'name'
                }
            })
            .sort({ lastActivity: -1 });

        // Get total quizzes completed across all courses
        const Progress = require('../models/Progress');
        const quizzesCompleted = await Progress.countDocuments({
            studentID: studentId,
            contentType: 'quiz',
            status: 'completed'
        });

        // Map to cleaner structure
        const courses = enrollments
            .filter(e => e.courseID && e.courseID.status === 'published') // Filter out nulls and non-published courses
            .map(e => ({
                _id: e.courseID._id,
                title: e.courseID.title,
                description: e.courseID.description,
                thumbnail: e.courseID.thumbnail,
                category: e.courseID.category,
                instructor: e.courseID.instructorID,
                progress: e.progressPercentage || 0,
                enrolledAt: e.enrolledAt,
                lastActivity: e.lastActivity,
                status: e.status
            }));

        res.json({ 
            success: true, 
            courses,
            stats: {
                quizzesCompleted,
                totalCourses: courses.length
            }
        });
    } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getStudentCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user.id;

        const enrollment = await Enrollment.findOne({ studentID: studentId, courseID: courseId });
        if (!enrollment) {
            return res.status(403).json({ success: false, message: 'Access denied. Not enrolled.' });
        }

        const course = await Course.findById(courseId).populate('instructorID', 'name');
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        const modules = await Module.find({ courseID: courseId }).sort({ order: 1 });
        const modulesWithContent = await Promise.all(
            modules.map(async (module) => {
                const contents = await CourseContent.find({ moduleID: module._id })
                    .sort({ order: 1 })
                    .populate('quizID', 'title duration');

                return {
                    ...module.toObject(),
                    contents
                };
            })
        );

        res.json({ success: true, course, modules: modulesWithContent });

    } catch (error) {
        console.error("Error fetching student course:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get detailed progress report for student
exports.getStudentProgressReport = async (req, res) => {
    try {
        const studentId = req.user.id;
        const QuizAttempt = require('../models/QuizAttempt');
        const Progress = require('../models/Progress');

        // 1. Get all enrollments with course details
        const enrollments = await Enrollment.find({ studentID: studentId })
            .populate('courseID', 'title category thumbnail');

        // 2. Get all quiz attempts
        const quizAttempts = await QuizAttempt.find({ studentID: studentId })
            .populate('quizID', 'title')
            .populate('courseID', 'title')
            .sort({ createdAt: -1 });

        // 3. Calculate stats
        const totalCourses = enrollments.length;
        const completedCourses = enrollments.filter(e => e.progressPercentage === 100).length;
        const avgProgress = totalCourses > 0 
            ? Math.round(enrollments.reduce((acc, e) => acc + (e.progressPercentage || 0), 0) / totalCourses)
            : 0;
        
        const totalQuizzes = quizAttempts.length;
        const avgQuizScore = totalQuizzes > 0
            ? Math.round(quizAttempts.reduce((acc, q) => acc + q.score, 0) / totalQuizzes)
            : 0;

        // 4. Get achievements (mock logic for now, can be expanded)
        const achievements = [
            { title: "First Course Enrolled", icon: "BookOpen", earned: totalCourses > 0 },
            { title: "Course Finisher", icon: "Award", earned: completedCourses > 0 },
            { title: "Quiz Taker", icon: "Target", earned: totalQuizzes > 0 },
            { title: "High Achiever", icon: "Zap", earned: avgQuizScore >= 80 && totalQuizzes > 0 },
        ];

        res.json({
            success: true,
            report: {
                stats: {
                    totalCourses,
                    completedCourses,
                    avgProgress,
                    totalQuizzes,
                    avgQuizScore
                },
                courses: enrollments.map(e => ({
                    id: e.courseID._id,
                    title: e.courseID.title,
                    category: e.courseID.category,
                    progress: e.progressPercentage || 0,
                    lastActivity: e.lastActivity
                })),
                quizAttempts: quizAttempts.map(q => ({
                    id: q._id,
                    quizTitle: q.quizID?.title || 'Deleted Quiz',
                    courseTitle: q.courseID?.title || 'Deleted Course',
                    score: q.score,
                    passed: q.passed,
                    date: q.createdAt
                })),
                achievements
            }
        });

    } catch (error) {
        console.error("Error fetching progress report:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
