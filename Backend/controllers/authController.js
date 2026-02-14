const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Register new user (Student or Instructor)
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
    try {
        console.log('🔵 Signup Request Received:', { body: req.body });

        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation Failed:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, email, password, role, institution, department, message } = req.body;
        console.log('📧 Checking if user exists:', email);

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('⚠️  User already exists:', email);
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Validate role (only allow student or instructor during signup)
        if (role && !['student', 'instructor'].includes(role)) {
            console.log('❌ Invalid role:', role);
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Only student or instructor allowed during signup.'
            });
        }

        console.log('💾 Creating user in MongoDB...');
        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'student', // Default to student if not provided
            institution: institution || undefined,
            department: department || undefined,
            bio: message || undefined
        });
        console.log('✅ User created successfully:', user._id, user.email, 'Status:', user.status);

        // For instructors, don't generate token - they need admin approval
        if (user.role === 'instructor' && user.status === 'pending') {
            console.log('⏳ Instructor account pending approval');
            return res.status(201).json({
                success: true,
                message: 'Instructor request submitted successfully. Your account will be reviewed by an admin.',
                requiresApproval: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    createdAt: user.createdAt
                }
            });
        }

        // Generate token for students (active by default)
        const token = user.generateAuthToken();
        console.log('🔑 Token generated for user:', user.email);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                profileImage: user.profileImage,
                isVerified: user.isVerified,
                createdAt: user.createdAt
            }
        });
        console.log('✅ Signup response sent successfully');
    } catch (error) {
        console.error('❌ Signup Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password, role } = req.body;
        console.log(`🔐 Login attempt: ${email} | Requested Role: ${role}`);

        // Check if user exists (include password for comparison)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Validate role matches if role was specified in request
        if (role && user.role !== role) {
            console.log(`❌ Role Mismatch! User is '${user.role}' but requested '${role}'`);
            const correctTab = user.role.charAt(0).toUpperCase() + user.role.slice(1);
            return res.status(401).json({
                success: false,
                message: `Invalid credentials. Please login via the ${correctTab} tab.`
            });
        }

        // Check instructor status before allowing login
        if (user.role === 'instructor') {
            if (user.status === 'pending') {
                return res.status(403).json({
                    success: false,
                    message: 'Your instructor account is pending admin approval',
                    status: 'pending',
                    metadata: {
                        submittedDate: user.createdAt
                    }
                });
            }
            if (user.status === 'rejected') {
                return res.status(403).json({
                    success: false,
                    message: 'Your instructor access request was not approved',
                    status: 'rejected',
                    metadata: {
                        reason: user.rejectionReason || 'No reason provided'
                    }
                });
            }
            // Only 'approved' status allowed to proceed
            if (user.status !== 'approved') {
                return res.status(403).json({
                    success: false,
                    message: 'Invalid account status'
                });
            }
        }

        // Generate token
        const token = user.generateAuthToken();

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                profileImage: user.profileImage,
                isVerified: user.isVerified,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login',
            error: error.message
        });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { name, profileImage } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (profileImage) updateData.profileImage = profileImage;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

// @desc    Verify token validity
// @route   GET /api/auth/verify-token
// @access  Private
const verifyToken = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Token is valid',
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error verifying token',
            error: error.message
        });
    }
};

module.exports = {
    signup,
    login,
    getProfile,
    updateProfile,
    verifyToken
};
