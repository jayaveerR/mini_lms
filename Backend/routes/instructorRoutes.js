const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isInstructor } = require('../middleware/roleCheck');

// Import controllers
const courseController = require('../controllers/courseController');
const moduleController = require('../controllers/moduleController');
const contentController = require('../controllers/contentController');
const quizController = require('../controllers/quizController');
const analyticsController = require('../controllers/analyticsController');
const materialController = require('../controllers/materialController');
const discussionController = require('../controllers/discussionController');
const notificationController = require('../controllers/notificationController');
const upload = require('../middleware/upload');

// All routes require authentication and instructor role
router.use(protect);
router.use(isInstructor);

// Dashboard routes
router.get('/dashboard/summary', analyticsController.getDashboardSummary);

// Course routes
router.get('/courses', courseController.getInstructorCourses);
router.post('/courses', courseController.createCourse);
router.get('/courses/:courseId', courseController.getCourseById);
router.put('/courses/:courseId', courseController.updateCourse);
router.delete('/courses/:courseId', courseController.deleteCourse);
router.post('/courses/:courseId/publish', courseController.publishCourse);
router.post('/courses/:courseId/unpublish', courseController.unpublishCourse);

// Module routes
router.post('/modules', moduleController.createModule);
router.get('/courses/:courseId/modules', moduleController.getCourseModules);
router.put('/modules/:moduleId', moduleController.updateModule);
router.delete('/modules/:moduleId', moduleController.deleteModule);

// Content routes
router.post('/content', contentController.createContent);
router.get('/modules/:moduleId/content', contentController.getModuleContent);
router.put('/content/:contentId', contentController.updateContent);
router.delete('/content/:contentId', contentController.deleteContent);

// Quiz routes
router.get('/quizzes', quizController.getInstructorQuizzes);
router.post('/quizzes', quizController.createQuiz);
router.get('/quizzes/:quizId', quizController.getQuizById);
router.put('/quizzes/:quizId', quizController.updateQuiz);
router.delete('/quizzes/:quizId', quizController.deleteQuiz);
router.post('/quizzes/:quizId/duplicate', quizController.duplicateQuiz);
router.post('/quizzes/generate', quizController.generateQuizAI);
router.post('/quizzes/suggest-options', quizController.suggestOptionsAI);
router.get('/quizzes/:quizId/results', quizController.getQuizResults);

// Analytics routes
router.get('/analytics/courses/:courseId', analyticsController.getCourseAnalytics);

// Student management routes
router.get('/students', analyticsController.getInstructorStudents);
router.get('/students/:studentId', analyticsController.getStudentDetail);

// Study Material routes
router.get('/materials', materialController.getInstructorMaterials);
router.post('/materials', upload.single('file'), materialController.uploadMaterial);
router.delete('/materials/:id', materialController.deleteMaterial);

// Discussion routes
router.get('/courses/:courseId/discussions', discussionController.getCourseDiscussions);
router.post('/discussions', discussionController.createDiscussion);
router.post('/discussions/:discussionId/reply', discussionController.addReply);
router.put('/discussions/:discussionId/status', discussionController.updateStatus);
router.post('/discussions/:discussionId/replies/:replyId/accept', discussionController.markAcceptedAnswer);
router.post('/discussions/:discussionId/pin', discussionController.togglePin);
router.post('/discussions/:discussionId/replies/:replyId/helpful', discussionController.toggleHelpful);
router.post('/discussions/:discussionId/replies/:replyId/endorse', discussionController.toggleEndorsement);
router.delete('/discussions/:discussionId', discussionController.deletePost);
router.delete('/discussions/:discussionId/replies/:replyId', discussionController.deletePost);

// Notifications
router.get('/notifications', notificationController.getNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);
router.delete('/notifications/:id', notificationController.deleteNotification);

module.exports = router;
