const StudyMaterial = require('../models/StudyMaterial');
const Course = require('../models/Course');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Upload to Pinata
const uploadToPinata = async (file) => {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path));
    
    const metadata = JSON.stringify({
        name: file.originalname,
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
        cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    try {
        const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
            maxBodyLength: "Infinity",
            headers: {
                'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                'Authorization': `Bearer ${process.env.PINATA_JWT}`
            }
        });
        return res.data.IpfsHash;
    } catch (error) {
        console.error('Pinata upload error:', error);
        throw new Error('Failed to upload to IPFS');
    }
};

// Create study material
exports.uploadMaterial = async (req, res) => {
    try {
        const { title, description, courseID, moduleID } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        if (!title || !courseID || !moduleID) {
            return res.status(400).json({ success: false, message: 'Title, course, and module are required' });
        }

        // Verify instructor owns the course
        const course = await Course.findOne({ _id: courseID, instructorID: req.user.id });
        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found or unauthorized' });
        }

        // Upload to Pinata
        const fileCID = await uploadToPinata(file);
        const fileUrl = `${process.env.PINATA_GATEWAY}${fileCID}`;

        const newMaterial = new StudyMaterial({
            title,
            description,
            courseID,
            moduleID,
            instructorID: req.user.id,
            fileCID,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            fileUrl
        });

        await newMaterial.save();

        // Clean up local file
        fs.unlinkSync(file.path);

        res.status(201).json({ 
            success: true, 
            material: newMaterial, 
            message: 'Study material uploaded successfully' 
        });
    } catch (error) {
        console.error('Error uploading material:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

// Get instructor materials
exports.getInstructorMaterials = async (req, res) => {
    try {
        const { courseId } = req.query;
        const filter = { instructorID: req.user.id };
        if (courseId) filter.courseID = courseId;

        const materials = await StudyMaterial.find(filter)
            .populate('courseID', 'title')
            .populate('moduleID', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, materials });
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get student materials (for enrolled courses)
exports.getStudentMaterials = async (req, res) => {
    try {
        const { courseId } = req.params;
        
        // In a real app, verify enrollment here
        const materials = await StudyMaterial.find({ courseID: courseId, active: true })
            .populate('moduleID', 'name')
            .sort({ createdAt: -1 });

        res.json({ success: true, materials });
    } catch (error) {
        console.error('Error fetching student materials:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete material
exports.deleteMaterial = async (req, res) => {
    try {
        const material = await StudyMaterial.findOne({ _id: req.params.id, instructorID: req.user.id });
        if (!material) {
            return res.status(404).json({ success: false, message: 'Material not found' });
        }

        await StudyMaterial.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Material deleted successfully' });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
