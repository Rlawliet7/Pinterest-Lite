import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// ── GET /api/users/me ─────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ user: req.user });
});

// ── PUT /api/users/me ─────────────────────────────────────────
export const updateMe = asyncHandler(async (req, res) => {
  const { name, avatarUrl } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  if (Object.keys(updates).length === 0) {
    throw new AppError('No valid fields provided to update', 400);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    console.error('[ERR] User not found during update:', req.user._id);
    throw new AppError('User not found', 404);
  }

  console.log('[LOG] User profile updated:', updatedUser.email);

  res.status(200).json({ user: updatedUser });
});