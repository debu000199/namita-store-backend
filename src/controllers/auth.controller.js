import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { signupSchema, signinSchema } from '../validations/auth.validation.js';
import {
  JWT_SECRET,
  JWT_EXPIRE,
  cookieOptions,
  ADMIN_JWT_SECRET,
  ADMIN_JWT_SECRET_EXPIRE,
} from '../config/jwt.config.js';

// Generate JWT Token
const generateToken = (userId, isAdmin, secret, expiresIn) => {
  return jwt.sign({ userId, isAdmin }, secret, { expiresIn });
};

//Signup
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input using Zod schema
    const validationResult = signupSchema.safeParse({
      name,
      email,
      password,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path[0],
        message: err.message,
      }));
      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        message: 'Email already registered. Please use a different email.',
      });
    }

    // Create new user
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
    });

    // Generate JWT token
    const token = generateToken(newUser._id, JWT_SECRET, JWT_EXPIRE);

    // Set token in cookie
    res.cookie('token', token, cookieOptions);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser.toJSON(),
    });
  } catch (error) {
    console.log('Error happen while signup: ', error.message);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Signin
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input using Zod schema
    const validationResult = signinSchema.safeParse({
      email,
      password,
    });

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path[0],
        message: err.message,
      }));
      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }

    // Find user and explicitly select password
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select('+password');

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password Or you are not signed up',
      });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token (if user/admin) attatch the role in the token
    let token;

    if (user.isAdmin === true) {
      token = generateToken(
        user._id,
        user.isAdmin,
        ADMIN_JWT_SECRET,
        ADMIN_JWT_SECRET_EXPIRE
      );
    } else {
      token = generateToken(user._id, user.isAdmin, JWT_SECRET, JWT_EXPIRE);
    }

    // Set token in cookie
    res.cookie('token', token, cookieOptions);

    return res.status(200).json({
      message: 'User logged in successfully',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.log('Error happen while signin: ', error.message);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Logout/Signout
export const signout = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie('token', cookieOptions);

    return res.status(200).json({
      message: 'User logged out successfully',
    });
  } catch (error) {
    console.log('Error happen while signout: ', error.message);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};
