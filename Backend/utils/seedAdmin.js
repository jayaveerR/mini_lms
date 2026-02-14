const User = require('../models/User');

const seedAdmin = async () => {
    try {
        // Check if admin already exists
        const adminExists = await User.findOne({ role: 'admin' });

        if (adminExists) {
            console.log('ℹ️  Admin user already exists');
            return;
        }

        // Create default admin user
        const admin = await User.create({
            name: 'EduNexus Admin',
            email: 'admin@edunexus.com',
            password: 'Admin@123',
            role: 'admin',
            isVerified: true
        });

        console.log('✅ Admin user seeded successfully');
        console.log('📧 Email: admin@edunexus.com');
        console.log('🔑 Password: Admin@123');
        console.log('⚠️  Please change the default password in production!');
    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
    }
};

module.exports = seedAdmin;
