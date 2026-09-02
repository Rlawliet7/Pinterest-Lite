import bcrypt from 'bcrypt';
import User from '../models/User.js';
import tokenService from '../services/token.service.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const SALT_ROUNDS = 10;

// ── POST /api/auth/register ──────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }
  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    console.warn('[WARN] Registration attempt with duplicate email:', email);
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    email,
    passwordHash,
    name: name || '',
  });

  const accessToken = tokenService.signAccessToken({ userId: user._id });
  const refreshToken = tokenService.signRefreshToken({ userId: user._id });
  await tokenService.storeRefreshToken(user._id, refreshToken);

  console.log('[LOG] User registered:', user.email);

  res.status(201).json({ user, accessToken, refreshToken });
});

// ── POST /api/auth/login ──────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    console.warn('[WARN] Login attempt with unknown email:', email);
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    console.warn('[WARN] Login attempt with wrong password for:', email);
    throw new AppError('Invalid email or password', 401);
  }

  const accessToken = tokenService.signAccessToken({ userId: user._id });
  const refreshToken = tokenService.signRefreshToken({ userId: user._id });
  await tokenService.storeRefreshToken(user._id, refreshToken);

  console.log('[LOG] User logged in:', user.email);

  res.status(200).json({ user, accessToken, refreshToken });
});

// ── POST /api/auth/refresh ─────────────────────────────────────
export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  const result = await tokenService.rotateRefreshToken(refreshToken);

  console.log('[LOG] Access token refreshed for user:', result.userId);

  res.status(200).json({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

// ── POST /api/auth/logout ───────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  await tokenService.revokeRefreshToken(refreshToken);

  console.log('[LOG] User logged out, refresh token revoked');

  res.status(204).send();
});

// ── GET /api/auth/me ─────────────────────────────────────────────
export const me = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});