import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../server';

const router = express.Router();

// POST /api/auth/login - Admin login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const admin = await prisma.adminUser.findUnique({
      where: { email }
    });

    if (!admin || !await bcrypt.compare(password, admin.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT with expiration
    const token = jwt.sign(
      { id: admin.id, email: admin.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    // Log successful login
    console.log(`Admin login successful: ${admin.email}`);

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Login error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      email: req.body.email,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
