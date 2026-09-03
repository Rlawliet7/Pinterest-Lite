import tokenService from '../services/token.service.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[WARN] Missing or malformed Authorization header');
    throw new AppError('Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = tokenService.verifyAccessToken(token);
  } catch (err) {
    console.warn('[WARN] Invalid or expired access token:', err.message);
    throw new AppError('Invalid or expired access token', 401);
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    console.warn('[WARN] Access token valid but user no longer exists:', decoded.userId);
    throw new AppError('User not found', 401);
  }

  req.user = user;
  next();
});

export default authMiddleware;