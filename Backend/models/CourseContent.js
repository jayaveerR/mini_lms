const mongoose = require('mongoose');

const courseContentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
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
    instructorID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contentType: {
        type: String,
        enum: ['video', 'notes', 'assignment'],
        required: true
    },
    videoURL: {
        type: String,
        default: ''
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    description: {
        type: String,
        default: ''
    },
    order: {
        type: Number,
        required: true
    },
    quizID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient querying
courseContentSchema.index({ moduleID: 1, order: 1 });
courseContentSchema.index({ instructorID: 1 });

module.exports = mongoose.model('CourseContent', courseContentSchema);
