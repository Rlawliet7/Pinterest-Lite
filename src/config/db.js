import mongoose from 'mongoose';
import env from './env.js';

const cached = globalThis._mongooseConn || { conn: null, promise: null };
globalThis._mongooseConn = cached;

async function connectDB() {
  if (cached.conn) {
    console.log('[LOG] Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('[LOG] Creating new MongoDB connection');
    cached.promise = mongoose
      .connect(env.mongodbUri)
      .then((mongooseInstance) => {
        console.log('[LOG] MongoDB connected');
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        console.error('[ERR] MongoDB connection error:', err.message);
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    console.error('[ERR] Failed to establish MongoDB connection');
    throw err;
  }

  mongoose.connection.on('error', (err) => {
    console.error('[ERR] MongoDB runtime error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[WARN] MongoDB disconnected');
  });

  return cached.conn;
}

export default connectDB;