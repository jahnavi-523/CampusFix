import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Remove sensitive information from response
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  collegeId: user.collegeId || '',
  role: user.role,
  department: user.department,
  staffApprovalStatus: user.staffApprovalStatus || 'not_required',
});

// REGISTER
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      collegeId,
      department,
      role,
    } = req.body;

    // Public registration supports students and staff only.
    // Admin accounts must be created through a trusted process.
    if (role && !['student', 'staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration role.',
      });
    }

    const requestedRole = role || 'student';
    const isStaff = requestedRole === 'staff';

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required.',
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must contain at least 2 characters.',
      });
    }

    // Validate email format
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    // Validate college ID
    if (
      typeof collegeId !== 'string' ||
      !collegeId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: `Please enter your ${isStaff ? 'Staff ID' : 'Student ID'}.`,
      });
    }

    if (collegeId.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Student/Staff ID cannot exceed 50 characters.',
      });
    }

    // Validate department
    if (
      typeof department !== 'string' ||
      !department.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please select a department.',
      });
    }

    // Validate password
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters.',
      });
    }

    // Check existing email
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create account
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      collegeId: collegeId.trim(),
      password: hashedPassword,
      department: department.trim(),
      role: requestedRole,

      // Students are active immediately.
      // Staff must wait for Admin approval.
      staffApprovalStatus: isStaff ? 'pending' : 'not_required',
      isActive: !isStaff,
    });

    // Staff must not receive a login token before approval.
    if (isStaff) {
      return res.status(201).json({
        success: true,
        message:
          'Staff registration submitted successfully. Please wait for Admin approval before logging in.',
        user: formatUser(user),
      });
    }

    // Student registration
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    console.error('Registration error:', error);

    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password first
    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Block staff whose registration has not been approved.
    if (
      user.role === 'staff' &&
      ['pending', 'rejected'].includes(user.staffApprovalStatus)
    ) {
      if (user.staffApprovalStatus === 'pending') {
        return res.status(403).json({
          success: false,
          message:
            'Your staff registration is pending Admin approval.',
          approvalStatus: 'pending',
        });
      }

      return res.status(403).json({
        success: false,
        message:
          'Your staff registration was rejected. Please contact the administrator.',
        approvalStatus: 'rejected',
      });
    }

    // Block inactive accounts
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          'Your account is inactive. Contact the administrator.',
      });
    }

    // Successful login
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};