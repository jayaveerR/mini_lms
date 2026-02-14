const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const progressController = require('../controllers/progressController');
const quizController = require('../controllers/quizController');
const studentController = require('../controllers/studentController');
const materialController = require('../controllers/materialController');
const discussionController = require('../controllers/discussionController');
const notificationController = require('../controllers/notificationController');

// --- Course Discovery & Enrollment ---
router.get('/courses', protect, studentController.getAllCourses);
router.get('/my-courses', protect, studentController.getEnrolledCourses);
router.post('/courses/:courseId/enroll', protect, studentController.enrollCourse);
router.get('/courses/:courseId', protect, studentController.getStudentCourse);

// --- Progress Tracking ---
router.post('/progress/video', protect, progressController.markVideoCompleted);
router.post('/progress/complete', protect, progressController.completeCourse);
router.post('/progress/reset', protect, progressController.resetCourseProgress);

// Get course progress (completed items)
router.get('/progress/:courseId', protect, progressController.getCourseProgress);

// Get detailed progress report
router.get('/progress-report', protect, studentController.getStudentProgressReport);

// Quizzes
router.get('/quizzes', protect, quizController.getStudentQuizzes);

// Get quiz (Enforces Video Completion Lock)
router.get('/quiz/:quizId', protect, quizController.getStudentQuiz);
router.post('/quiz/:quizId/submit', protect, quizController.submitQuiz);

// Study Materials
router.get('/courses/:courseId/materials', protect, materialController.getStudentMaterials);

// Discussions
router.get('/courses/:courseId/discussions', protect, discussionController.getCourseDiscussions);
router.post('/discussions', protect, discussionController.createDiscussion);
router.post('/discussions/:discussionId/reply', protect, discussionController.addReply);
router.post('/discussions/:discussionId/like', protect, discussionController.toggleLike);
router.post('/discussions/:discussionId/replies/:replyId/helpful', protect, discussionController.toggleHelpful);
router.delete('/discussions/:discussionId', protect, discussionController.deletePost);
router.delete('/discussions/:discussionId/replies/:replyId', protect, discussionController.deletePost);

// Notifications
router.get('/notifications', protect, notificationController.getNotifications);
router.put('/notifications/:id/read', protect, notificationController.markAsRead);
router.put('/notifications/read-all', protect, notificationController.markAllAsRead);
router.delete('/notifications/:id', protect, notificationController.deleteNotification);

module.exports = router;
