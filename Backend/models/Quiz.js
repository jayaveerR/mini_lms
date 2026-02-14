const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    isCorrect: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true
    },
    questionType: {
        type: String,
        enum: ['mcq-single', 'mcq-multiple', 'true-false', 'fill-blank'],
        required: true
    },
    options: [optionSchema],
    correctAnswer: {
        type: String, // For fill-blank type
        default: ''
    },
    points: {
        type: Number,
        default: 1
    },
    explanation: {
        type: String,
        default: ''
    }
}, { _id: true });

const quizSchema = new mongoose.Schema({
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
    contentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseContent',
        default: null
    },
    instructorID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    questions: [questionSchema],
    passingPercentage: {
        type: Number,
        default: 60,
        min: 0,
        max: 100
    },
    timeLimit: {
        type: Number, // in minutes
        default: null
    },
    retakePolicy: {
        type: String,
        enum: ['unlimited', 'limited', 'none'],
        default: 'unlimited'
    },
    maxRetakes: {
        type: Number,
        default: 3
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient querying
quizSchema.index({ instructorID: 1, courseID: 1 });
quizSchema.index({ contentID: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
