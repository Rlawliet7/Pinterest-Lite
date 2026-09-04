import mongoose from 'mongoose';
import app from '../src/app.js';
import env from '../src/config/env.js';
import connectDB from '../src/config/db.js';

let connecting = null;

async function ensureConnected() {
  if (mongoose.connection.readyState === 1) return;
  if (connecting) return connecting;
  connecting = connectDB().catch((err) => {
    connecting = null;
    throw err;
  });
  return connecting;
}

export default async function handler(req, res) {
  try {
    await ensureConnected();
  } catch (err) {
    console.error('[ERR] DB connect failed in handler:', err.message);
    res.status(500).json({ error: { message: 'Database connection failed' } });
    return;
  }
  return app(req, res);
}

if (process.env.VERCEL !== '1') {
  app.listen(env.port, () => {
    console.log(`[LOG] Server running on http://localhost:${env.port}`);
  });
}