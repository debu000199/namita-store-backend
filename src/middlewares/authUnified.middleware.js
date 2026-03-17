import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { JWT_SECRET, ADMIN_JWT_SECRET } from '../config/jwt.config.js';

export const authUnifiedMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res
        .status(401)
        .json({ message: 'No token found! Please Login or signup.' });
    }

    // Decode to check the role, but DO NOT trust this data yet.
    const unverifiedPayload = jwt.decode(token);
    if (!unverifiedPayload) {
      return res.status(401).json({ message: 'Invalid token structure.' });
    }

    // Determine which secret to use based on the unverified payload
    const secretToUse = unverifiedPayload.isAdmin
      ? ADMIN_JWT_SECRET
      : JWT_SECRET;

    // Verify the token securely. If they faked isAdmin but don't know the ADMIN_JWT_SECRET, this will throw an error and go to catch.
    const data = jwt.verify(token, secretToUse);

    if (!data.userId) {
      return res.status(403).json({ message: 'Invalid token payload.' });
    }

    const user = await User.findById(data.userId)
      .select('-password')
      .populate({
        path: 'orders',
        select: 'address',
        populate: {
          path: 'address',
          select: 'phone line1 line2 city state postalCode',
        },
      });

    // Null check BEFORE accessing user properties
    if (!user) {
      return res
        .status(401)
        .json({ message: 'Unauthorized - User not found.' });
    }

    // Role verification: Ensure a regular user didn't somehow get an admin token
    if (unverifiedPayload.isAdmin && user.isAdmin === false) {
      return res
        .status(403)
        .json({ message: 'Unauthorized access. Role mismatch.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({
      message: 'Unauthorized - Invalid or expired token.',
      // Consider removing error.message in production to avoid leaking details
      error: error.message,
    });
  }
};
