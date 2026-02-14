const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['NEW_THREAD', 'NEW_REPLY', 'MENTION', 'ACCEPTED_ANSWER', 'ENDORSEMENT'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String // URL or route to the discussion
    },
    isRead: {
        type: Boolean,
        default: false
    },
    courseID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
