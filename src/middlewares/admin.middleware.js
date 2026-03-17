import jwt from 'jsonwebtoken';
import { ADMIN_JWT_SECRET } from '../config/jwt.config.js';
import User from '../models/user.model.js';

export const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Token required' });
    }

    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);

    if (!decoded?.userId) {
      return res.status(403).json({ message: 'Invalid token payload' });
    }

    const admin = await User.findById(decoded.userId).select('-password');

    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    req.user = admin;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid token' });
    }

    console.error('Admin middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
