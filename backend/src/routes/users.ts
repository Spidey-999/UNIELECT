import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { authenticateUser, UserRequest } from '../middleware/userAuth';

const router = express.Router();

// Validation schemas
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phoneNumber')
    .optional()
    .matches(/^\+?\d{10,15}$/)
    .withMessage('Please provide a valid phone number')
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email or ATU ID is required')
    .custom((value) => {
      // Check if it's a valid email or ATU ID format (8 numbers + 1 capital letter)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const atuIdRegex = /^\d{8}[A-Z]$/;
      
      if (!emailRegex.test(value) && !atuIdRegex.test(value)) {
        throw new Error('Please provide a valid email or Student ID (e.g., 01244086B or student@unielect.edu.gh)');
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// User registration
router.post('/register', registerValidation, async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, firstName, lastName, password, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phoneNumber ? [{ phoneNumber }] : [])
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email ? 'Email already registered' : 'Phone number already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        passwordHash,
        phoneNumber: phoneNumber || null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        type: 'user'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    console.log(`User registered: ${user.email}`);

    res.json({
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      email: req.body.email,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
router.post('/login', loginValidation, async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Handle ATU ID format - convert to email if it's an ATU ID
    let searchEmail = email;
    const atuIdRegex = /^\d{8}[A-Z]$/;
    
    if (atuIdRegex.test(email)) {
      // If it's an ATU ID, search by email format
      // In a real system, you'd have a separate ATU ID field
      // For now, we'll assume the email is the primary identifier
      console.log(`ATU ID login attempt: ${email}`);
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: searchEmail }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token (id and type must match UserRequest/auth middleware expectations)
    const token = jwt.sign(
      { id: user.id, email: user.email, type: 'user' },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile (requires authentication)
router.get('/profile', authenticateUser, async (req: UserRequest, res: express.Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
