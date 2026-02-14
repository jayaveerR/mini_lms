const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    selectedOptions: [{
        type: String
    }],
    textAnswer: {
        type: String,
        default: ''
    },
    isCorrect: {
        type: Boolean,
        required: true
    },
    pointsEarned: {
        type: Number,
        default: 0
    }
}, { _id: false });

const quizAttemptSchema = new mongoose.Schema({
    studentID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quizID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    courseID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    answers: [answerSchema],
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    totalPoints: {
        type: Number,
        required: true
    },
    earnedPoints: {
        type: Number,
        required: true
    },
    passed: {
        type: Boolean,
        required: true
    },
    attemptNumber: {
        type: Number,
        required: true,
        default: 1
    },
    timeSpent: {
        type: Number, // in seconds
        default: 0
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient querying
quizAttemptSchema.index({ studentID: 1, quizID: 1 });
quizAttemptSchema.index({ quizID: 1, submittedAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
