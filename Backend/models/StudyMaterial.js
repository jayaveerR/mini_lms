const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
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
    fileCID: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String
    },
    fileSize: {
        type: Number
    },
    fileUrl: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient querying
studyMaterialSchema.index({ instructorID: 1, courseID: 1 });
studyMaterialSchema.index({ courseID: 1, moduleID: 1 });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
