const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
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
} = require('../controllers/adminController');
const discussionController = require('../controllers/discussionController');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// All routes require authentication and admin role
router.use(protect, isAdmin);

// Instructor management routes
router.get('/instructors/pending', getPendingInstructors);
router.get('/instructors', getAllInstructors);
router.put('/instructors/:id/approve', approveInstructor);
router.put('/instructors/:id/reject', rejectInstructor);
router.delete('/instructors/:id', deleteInstructor);

// User management routes
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);

// Course management routes
router.get('/courses', getAllCourses);
router.put('/courses/:id/status', updateCourseStatus);

// Analytics routes
router.get('/analytics', getPlatformAnalytics);

// Settings routes
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Discussion Moderation
router.delete('/discussions/:discussionId', discussionController.deletePost);
router.delete('/discussions/:discussionId/replies/:replyId', discussionController.deletePost);
router.put('/discussions/:discussionId/status', discussionController.updateStatus);

module.exports = router;
