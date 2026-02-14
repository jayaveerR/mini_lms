const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    activityType: {
        type: String,
        enum: [
            'video_started',
            'video_completed',
            'quiz_submitted',
            'module_started',
            'course_enrolled',
            'course_completed',
            'login'
        ],
        required: true
    },
    courseID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        default: null
    },
    moduleID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        default: null
    },
    contentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseContent',
        default: null
    },
    quizID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false
});

// Index for efficient queries
activityLogSchema.index({ userID: 1, timestamp: -1 });
activityLogSchema.index({ courseID: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
