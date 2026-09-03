import app from './src/app.js';
import connectDB from './src/config/db.js';
import env from './src/config/env.js';

async function startServer() {
  try {
    await connectDB();

    app.listen(env.port, () => {
      console.log(`[LOG] Server running on http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error('[ERR] Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();