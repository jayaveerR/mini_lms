const mongoose = require('mongoose');

const connectDatabase = async () => {
    try {
        // Try connecting to the primary URI (Atlas)
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000 // Fail fast if Atlas is unreachable
        });
        console.log(`✅ MongoDB Connected (Primary): ${conn.connection.host}`);
    } catch (error) {
        console.error(`⚠️  Atlas Connection Failed: ${error.message}`);
        console.log('🔄 Attempting to connect to Local MongoDB...');

        try {
            // Fallback to local MongoDB
            const localUri = 'mongodb://127.0.0.1:27017/EduNexus';
            const conn = await mongoose.connect(localUri);
            console.log(`✅ MongoDB Connected (Local Fallback): ${conn.connection.host}`);
        } catch (localError) {
            console.error(`❌ Local MongoDB Connection Error: ${localError.message}`);
            process.exit(1);
        }
    }
};

module.exports = connectDatabase;
