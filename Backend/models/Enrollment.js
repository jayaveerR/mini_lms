const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
    studentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    completedItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseContent'
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'completed'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Unique enrollment per student per course
enrollmentSchema.index({ studentID: 1, courseID: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
