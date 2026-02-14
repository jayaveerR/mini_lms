const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const ActivityLog = require('../models/ActivityLog');
const Settings = require('../models/Settings');

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const { role, status } = req.query;
        const query = {};

        if (role) query.role = role;
        if (status) query.status = status;

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching users', error: error.message });
    }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
        
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.status(200).json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating user status', error: error.message });
    }
};

// @desc    Get all courses with filters
// @route   GET /api/admin/courses
// @access  Private/Admin
const getAllCourses = async (req, res) => {
    try {
        const { status, category } = req.query;
        const query = {};

        if (status) query.status = status;
        if (category) query.category = category;

        const courses = await Course.find(query)
            .populate('instructorID', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: courses.length,
            courses
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching courses', error: error.message });
    }
};

// @desc    Update course status
// @route   PUT /api/admin/courses/:id/status
// @access  Private/Admin
const updateCourseStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const course = await Course.findByIdAndUpdate(req.params.id, { status }, { new: true });
        
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        res.status(200).json({ success: true, course });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating course status', error: error.message });
    }
};

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getPlatformAnalytics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalInstructors = await User.countDocuments({ role: 'instructor' });
        const totalCourses = await Course.countDocuments();
        const publishedCourses = await Course.countDocuments({ status: 'published' });
        const totalEnrollments = await Enrollment.countDocuments();
        
        // Recent activity
        const recentActivity = await ActivityLog.find()
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('userID', 'name email')
            .populate('courseID', 'title');

        // Growth data (last 6 months)
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthName = date.toLocaleString('default', { month: 'short' });
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const userCount = await User.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } });
            const enrollmentCount = await Enrollment.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } });

            months.push({ month: monthName, users: userCount, enrollments: enrollmentCount });
        }

        res.status(200).json({
            success: true,
            analytics: {
                stats: {
                    totalUsers,
                    totalStudents,
                    totalInstructors,
                    totalCourses,
                    publishedCourses,
                    totalEnrollments
                },
                recentActivity,
                growth: months
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching analytics', error: error.message });
    }
};

// @desc    Get pending instructor requests
// @route   GET /api/admin/instructors/pending
// @access  Private/Admin
const getPendingInstructors = async (req, res) => {
    try {
        const pendingInstructors = await User.find({
            role: 'instructor',
            status: 'pending'
        }).select('-password').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: pendingInstructors.length,
            instructors: pendingInstructors
        });
    } catch (error) {
        console.error('Get Pending Instructors Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending instructors',
            error: error.message
        });
    }
};

// @desc    Get all instructors with filters
// @route   GET /api/admin/instructors
// @access  Private/Admin
const getAllInstructors = async (req, res) => {
    try {
        const { status } = req.query;
        const query = { role: 'instructor' };

        if (status) {
            query.status = status;
        }

        const instructors = await User.find(query)
            .select('-password')
            .populate('approvedBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: instructors.length,
            instructors
        });
    } catch (error) {
        console.error('Get All Instructors Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching instructors',
            error: error.message
        });
    }
};

// @desc    Approve instructor
// @route   PUT /api/admin/instructors/:id/approve
// @access  Private/Admin
const approveInstructor = async (req, res) => {
    try {
        const instructor = await User.findById(req.params.id);

        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: 'Instructor not found'
            });
        }

        if (instructor.role !== 'instructor') {
            return res.status(400).json({
                success: false,
                message: 'User is not an instructor'
            });
        }

        instructor.status = 'approved';
        instructor.approvedBy = req.user._id;
        instructor.approvedAt = new Date();
        instructor.rejectionReason = undefined; // Clear any previous rejection reason

        await instructor.save();

        console.log(`✅ Instructor approved: ${instructor.email} by ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: 'Instructor approved successfully',
            instructor: {
                id: instructor._id,
                name: instructor.name,
                email: instructor.email,
                status: instructor.status,
                approvedAt: instructor.approvedAt
            }
        });
    } catch (error) {
        console.error('Approve Instructor Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error approving instructor',
            error: error.message
        });
    }
};

// @desc    Reject instructor
// @route   PUT /api/admin/instructors/:id/reject
// @access  Private/Admin
const rejectInstructor = async (req, res) => {
    try {
        const { reason } = req.body;
        const instructor = await User.findById(req.params.id);

        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: 'Instructor not found'
            });
        }

        if (instructor.role !== 'instructor') {
            return res.status(400).json({
                success: false,
                message: 'User is not an instructor'
            });
        }

        instructor.status = 'rejected';
        instructor.rejectionReason = reason || 'No reason provided';
        instructor.approvedBy = undefined;
        instructor.approvedAt = undefined;

        await instructor.save();

        console.log(`❌ Instructor rejected: ${instructor.email} by ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: 'Instructor rejected',
            instructor: {
                id: instructor._id,
                name: instructor.name,
                email: instructor.email,
                status: instructor.status,
                rejectionReason: instructor.rejectionReason
            }
        });
    } catch (error) {
        console.error('Reject Instructor Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting instructor',
            error: error.message
        });
    }
};

// @desc    Delete instructor (for removing fake/test accounts)
// @route   DELETE /api/admin/instructors/:id
// @access  Private/Admin
const deleteInstructor = async (req, res) => {
    try {
        const instructor = await User.findById(req.params.id);

        if (!instructor) {
            return res.status(404).json({
                success: false,
                message: 'Instructor not found'
            });
        }

        if (instructor.role !== 'instructor') {
            return res.status(400).json({
                success: false,
                message: 'User is not an instructor'
            });
        }

        // Delete the instructor
        await User.findByIdAndDelete(req.params.id);

        console.log(`🗑️  Instructor deleted: ${instructor.email} by ${req.user.email}`);

        res.status(200).json({
            success: true,
            message: 'Instructor deleted successfully',
            deletedInstructor: {
                id: instructor._id,
                name: instructor.name,
                email: instructor.email
            }
        });
    } catch (error) {
        console.error('Delete Instructor Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting instructor',
            error: error.message
        });
    }
};

// @desc    Get platform settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.status(200).json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching settings', error: error.message });
    }
};

// @desc    Update platform settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings(req.body);
        } else {
            Object.assign(settings, req.body);
        }
        await settings.save();
        res.status(200).json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating settings', error: error.message });
    }
};

module.exports = {
    getPendingInstructors,
    getAllInstructors,
    approveInstructor,
    rejectInstructor,
    deleteInstructor,
    getAllUsers,
    updateUserStatus,
    getAllCourses,
    updateCourseStatus,
    getPlatformAnalytics,
    getSettings,
    updateSettings
};
