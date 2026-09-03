import multer from 'multer';

const errorMiddleware = (err, req, res, next) => {
  // Multer errors (file size, unexpected field, etc.)
  if (err instanceof multer.MulterError) {
    console.error('[ERR] Multer error:', err.message);
    return res.status(400).json({
      error: { message: err.message, status: 400 },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    console.error('[ERR] JWT error:', err.message);
    return res.status(401).json({
      error: { message: 'Invalid or expired token', status: 401 },
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    console.error('[ERR] Validation error:', err.message);
    return res.status(400).json({
      error: { message: err.message, status: 400 },
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    console.error('[ERR] Duplicate key error:', JSON.stringify(err.keyValue));
    return res.status(409).json({
      error: { message: 'Duplicate value violates unique constraint', status: 409 },
    });
  }

  // Custom operational errors (AppError)
  if (err.isOperational) {
    console.error('[ERR] Operational error:', err.message);
    return res.status(err.statusCode).json({
      error: { message: err.message, status: err.statusCode },
    });
  }

  // Fallback: unexpected/programmer errors
  console.error('[ERR] Unexpected error:', err.stack || err.message);
  return res.status(500).json({
    error: { message: 'Internal server error', status: 500 },
  });
};

export default errorMiddleware;