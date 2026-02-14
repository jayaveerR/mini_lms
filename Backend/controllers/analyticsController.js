const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const ActivityLog = require('../models/ActivityLog');
const CourseContent = require('../models/CourseContent');

// Get dashboard summary
exports.getDashboardSummary = async (req, res) => {
    try {
        const instructorID = req.user.id;

        // Get course count
        const totalCourses = await Course.countDocuments({ instructorID });
        const publishedCourses = await Course.countDocuments({ instructorID, status: 'published' });
        const draftCourses = totalCourses - publishedCourses;

        // Get unique student count across all courses
        const instructorCourses = await Course.find({ instructorID }).select('_id');
        const courseIDs = instructorCourses.map(c => c._id);

        const enrollments = await Enrollment.find({ courseID: { $in: courseIDs } });
        const uniqueStudents = new Set(enrollments.map(e => e.studentID.toString())).size;

        // Get active students (activity in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const activeEnrollments = enrollments.filter(e =>
            e.lastActivity && new Date(e.lastActivity) >= sevenDaysAgo
        );
        const activeStudents = new Set(activeEnrollments.map(e => e.studentID.toString())).size;

        // Get active quizzes
        const activeQuizzes = await Quiz.countDocuments({ instructorID, active: true });

        // Get recent activities
        const recentActivities = await ActivityLog.find({
            courseID: { $in: courseIDs }
        })
            .sort({ timestamp: -1 })
            .limit(15)
            .populate('userID', 'name')
            .populate('courseID', 'title')
            .populate('contentID', 'title');

        res.json({
            success: true,
            summary: {
                totalCourses,
                publishedCourses,
                draftCourses,
                totalStudents: uniqueStudents,
                activeStudents,
                activeQuizzes,
                recentActivities
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get course analytics
exports.getCourseAnalytics = async (req, res) => {
    try {
        const { courseId } = req.params;

        // Verify ownership
        const course = await Course.findOne({ _id: courseId, instructorID: req.user.id });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        // Get enrollments
        const enrollments = await Enrollment.find({ courseID: courseId });
        const totalStudents = enrollments.length;
        const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;

        // Average progress
        const avgProgress = totalStudents > 0
            ? enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / totalStudents
            : 0;

        // Completion rate
        const completionRate = totalStudents > 0
            ? (completedEnrollments / totalStudents) * 100
            : 0;

        // Quiz performance
        const quizzes = await Quiz.find({ courseID: courseId });
        const quizStats = await Promise.all(
            quizzes.map(async (quiz) => {
                const attempts = await QuizAttempt.find({ quizID: quiz._id });
                const avgScore = attempts.length > 0
                    ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
                    : 0;
                const passRate = attempts.length > 0
                    ? (attempts.filter(a => a.passed).length / attempts.length) * 100
                    : 0;

                return {
                    quizID: quiz._id,
                    title: quiz.title,
                    attempts: attempts.length,
                    avgScore: Math.round(avgScore),
                    passRate: Math.round(passRate)
                };
            })
        );

        // Engagement trend (last 7 days)
        const engagementTrend = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const count = await ActivityLog.countDocuments({
                courseID: courseId,
                timestamp: { $gte: startOfDay, $lte: endOfDay }
            });

            engagementTrend.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                count
            });
        }

        // Content popularity
        const contents = await CourseContent.find({ courseID: courseId, contentType: 'video' });
        const contentPopularity = await Promise.all(contents.map(async (content) => {
            const views = await ActivityLog.countDocuments({
                contentID: content._id,
                activityType: 'video_completed'
            });
            return {
                contentID: content._id,
                title: content.title,
                views
            };
        }));
        contentPopularity.sort((a, b) => b.views - a.views);

        res.json({
            success: true,
            analytics: {
                totalStudents,
                completedEnrollments,
                avgProgress: Math.round(avgProgress),
                completionRate: Math.round(completionRate),
                quizStats,
                engagementTrend,
                contentPopularity
            }
        });
    } catch (error) {
        console.error('Error fetching course analytics:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get students for instructor
exports.getInstructorStudents = async (req, res) => {
    try {
        const instructorID = req.user.id;
        const { courseId, status, search } = req.query;

        // Get instructor's courses
        const courseFilter = { instructorID };
        if (courseId) {
            courseFilter._id = courseId;
        }

        const instructorCourses = await Course.find(courseFilter).select('_id title');
        const courseIDs = instructorCourses.map(c => c._id);

        // Get enrollments
        const enrollmentFilter = { courseID: { $in: courseIDs } };
        const enrollments = await Enrollment.find(enrollmentFilter)
            .populate('studentID', 'name email')
            .populate('courseID', 'title');

        // Group by student
        const studentMap = new Map();

        enrollments.forEach(enrollment => {
            if (!enrollment.studentID) return;

            const studentId = enrollment.studentID._id.toString();

            if (!studentMap.has(studentId)) {
                studentMap.set(studentId, {
                    _id: studentId,
                    name: enrollment.studentID.name,
                    email: enrollment.studentID.email,
                    enrolledCourses: [],
                    totalProgress: 0,
                    lastActivity: enrollment.lastActivity
                });
            }

            const student = studentMap.get(studentId);
            student.enrolledCourses.push({
                courseId: enrollment.courseID._id,
                courseTitle: enrollment.courseID.title,
                progress: enrollment.progressPercentage,
                enrolledAt: enrollment.enrolledAt
            });
            student.totalProgress += enrollment.progressPercentage;

            // Update last activity if more recent
            if (!student.lastActivity || new Date(enrollment.lastActivity) > new Date(student.lastActivity)) {
                student.lastActivity = enrollment.lastActivity;
            }
        });

        // Convert to array and calculate averages
        let students = Array.from(studentMap.values()).map(student => {
            const avgProgress = student.enrolledCourses.length > 0
                ? Math.round(student.totalProgress / student.enrolledCourses.length)
                : 0;

            // Determine status
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

            let studentStatus = 'inactive';
            if (student.lastActivity && new Date(student.lastActivity) >= sevenDaysAgo) {
                studentStatus = 'active';
            } else if (avgProgress < 30) {
                studentStatus = 'at-risk';
            }

            return {
                ...student,
                avgProgress,
                status: studentStatus
            };
        });

        // Apply filters
        if (status && status !== 'all') {
            students = students.filter(s => s.status === status);
        }

        if (search) {
            const searchLower = search.toLowerCase();
            students = students.filter(s =>
                s.name.toLowerCase().includes(searchLower) ||
                s.email.toLowerCase().includes(searchLower)
            );
        }

        res.json({ success: true, students });
    } catch (error) {
        console.error('Error fetching instructor students:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get student detail
exports.getStudentDetail = async (req, res) => {
    try {
        const { studentId } = req.params;
        const instructorID = req.user.id;

        // Get instructor's courses
        const instructorCourses = await Course.find({ instructorID }).select('_id');
        const courseIDs = instructorCourses.map(c => c._id);

        // Get student enrollments in instructor's courses
        const enrollments = await Enrollment.find({
            studentID: studentId,
            courseID: { $in: courseIDs }
        }).populate('courseID', 'title');

        if (enrollments.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found in your courses' });
        }

        // Get quiz attempts
        const quizzes = await Quiz.find({ courseID: { $in: courseIDs } }).select('_id title');
        const quizIDs = quizzes.map(q => q._id);

        const quizAttempts = await QuizAttempt.find({
            studentID: studentId,
            quizID: { $in: quizIDs }
        })
            .populate('quizID', 'title')
            .sort({ submittedAt: -1 });

        // Get activity timeline
        const activities = await ActivityLog.find({
            userID: studentId,
            courseID: { $in: courseIDs }
        })
            .sort({ timestamp: -1 })
            .limit(20)
            .populate('courseID', 'title')
            .populate('contentID', 'title');

        res.json({
            success: true,
            studentDetail: {
                enrollments,
                quizAttempts,
                activities
            }
        });
    } catch (error) {
        console.error('Error fetching student detail:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
