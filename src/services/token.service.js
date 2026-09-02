import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import env from '../config/env.js';
import RefreshToken from '../models/RefreshToken.js';
import AppError from '../utils/AppError.js';

// ── Sign tokens ──────────────────────────────────────────────

function signAccessToken({ userId }) {
  return jwt.sign({ userId }, env.jwtAccessSecret, {
    expiresIn: env.accessTokenTtl,
  });
}

function signRefreshToken({ userId }) {
  return jwt.sign({ userId }, env.jwtRefreshSecret, {
    expiresIn: env.refreshTokenTtl,
  });
}

// ── Verify tokens ────────────────────────────────────────────

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwtAccessSecret);
  } catch (err) {
    console.error('[ERR] Access token verification failed:', err.message);
    throw err;
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.jwtRefreshSecret);
  } catch (err) {
    console.error('[ERR] Refresh token verification failed:', err.message);
    throw err;
  }
}

// ── Hashing ──────────────────────────────────────────────────

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// ── Helpers for TTL → Date ───────────────────────────────────

function ttlToDate(ttl) {
  // supports formats like '15m', '7d', '1h'
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) {
    console.warn('[WARN] Unrecognized TTL format, defaulting to 7 days:', ttl);
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + value * multipliers[unit]);
}

// ── Store / Revoke / Rotate ──────────────────────────────────

async function storeRefreshToken(userId, rawToken) {
  const tokenHash = hashToken(rawToken);
  const expiresAt = ttlToDate(env.refreshTokenTtl);

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
    revoked: false,
  });

  console.log('[LOG] Refresh token stored for user:', userId);
}

async function isRevoked(rawToken) {
  const tokenHash = hashToken(rawToken);
  const record = await RefreshToken.findOne({ tokenHash });

  if (!record) {
    console.warn('[WARN] Refresh token not found in store');
    return true; // treat unknown token as revoked/invalid
  }

  return record.revoked;
}

async function revokeRefreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const result = await RefreshToken.findOneAndUpdate(
    { tokenHash },
    { revoked: true }
  );

  if (!result) {
    console.warn('[WARN] Attempted to revoke a refresh token that does not exist');
  } else {
    console.log('[LOG] Refresh token revoked for user:', result.userId);
  }
}

async function rotateRefreshToken(rawToken) {
  // 1. Verify JWT signature/expiry
  const decoded = verifyRefreshToken(rawToken);

  // 2. Check revocation status (reuse detection)
  const revoked = await isRevoked(rawToken);
  if (revoked) {
    console.error('[ERR] Refresh token reuse detected or token already revoked');
    throw new AppError('Refresh token is invalid or has been revoked', 401);
  }

  // 3. Revoke old token
  await revokeRefreshToken(rawToken);

  // 4. Issue new tokens
  const newAccessToken = signAccessToken({ userId: decoded.userId });
  const newRefreshToken = signRefreshToken({ userId: decoded.userId });

  // 5. Store new refresh token
  await storeRefreshToken(decoded.userId, newRefreshToken);

  console.log('[LOG] Refresh token rotated for user:', decoded.userId);

  return {
    userId: decoded.userId,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  storeRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  isRevoked,
};