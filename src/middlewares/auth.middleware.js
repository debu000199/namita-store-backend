import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { JWT_SECRET } from '../config/jwt.config.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: 'Unauthorized - Please login',
      });
    }

    // Verify and decode token (throws error if invalid)
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user object to request for convenience
    const user = await User.findById(decoded.userId)
      .select('-password')
      .populate({
        path: 'orders',
        select: 'address',
        populate: {
          path: 'address',
          select: 'phone line1 line2 city state postalCode',
        },
      });
    if (!user) {
      return res.status(401).json({
        message: 'Unauthorized - User not found',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log('Auth error:', error.message);
    return res.status(401).json({
      message: 'Unauthorized - Invalid token',
      error: error.message,
    });
  }
};
