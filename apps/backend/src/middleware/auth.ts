import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../types';

interface JwtPayload {
  userId: string;
  username: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    const payload = decoded as JwtPayload;
    req.user = {
      id: payload.userId,
      username: payload.username,
      email: payload.email,
      createdAt: new Date(),
    };

    next();
  });
};

export const generateToken = (user: User): string => {
  const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';

  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
    },
    jwtSecret,
    { expiresIn: '24h' }
  );
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (!err && decoded) {
      const payload = decoded as JwtPayload;
      req.user = {
        id: payload.userId,
        username: payload.username,
        email: payload.email,
        createdAt: new Date(),
      };
    }
    next();
  });
};
