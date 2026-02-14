const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
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
    moduleID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        required: true
    },
    contentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseContent',
        required: true
    },
    contentType: {
        type: String,
        enum: ['video', 'quiz', 'assignment'],
        required: true
    },
    status: {
        type: String,
        enum: ['started', 'completed'],
        default: 'started'
    },
    watchTime: {
        type: Number,
        default: 0
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Ensure unique progress record per student and content item
progressSchema.index({ studentID: 1, contentID: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
