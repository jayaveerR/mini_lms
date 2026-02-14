const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    courseID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    authorID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['OPEN', 'RESOLVED', 'CLOSED'],
        default: 'OPEN'
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    acceptedAnswerId: {
        type: mongoose.Schema.Types.ObjectId
    },
    replies: [{
        authorID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: String,
        isHelpful: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        isInstructorEndorsed: {
            type: Boolean,
            default: false
        },
        attachments: [String],
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isHot: {
        type: Boolean,
        default: false
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Discussion', discussionSchema);
