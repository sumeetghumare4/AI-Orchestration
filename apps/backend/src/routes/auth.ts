import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';
import { dataStore } from '../data/store';
import { generateToken } from '../middleware/auth';
import { UnauthorizedError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

const router = Router();

// Login endpoint
router.post(
  '/login',
  validate([
    body('username').isString().trim().isLength({ min: 1 }).withMessage('Username is required'),
    body('password').isString().trim().isLength({ min: 1 }).withMessage('Password is required'),
  ]),
  (req: Request, res: Response) => {
    const { username, password } = req.body;

    const user = dataStore.getUserByUsername(username);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // In a real app, passwords would be hashed
    // For demo purposes, we'll accept a fixed password
    if (password !== 'password123' && password !== 'admin123') {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      },
      message: 'Login successful',
    });
  }
);

// Register endpoint
router.post(
  '/register',
  validate([
    body('username').isString().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isString().trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ]),
  (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = dataStore.getUserByUsername(username);
    if (existingUser) {
      throw new UnauthorizedError('Username already exists');
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = dataStore.createUser({ username, email, createdAt: new Date() });

    // Store hashed password in a real app
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      },
      message: 'Registration successful',
    });
  }
);

// Get current user profile
router.get('/me', (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError('Not authenticated');
  }

  const user = dataStore.getUser(req.user.id);

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

export default router;
