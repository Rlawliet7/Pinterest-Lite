const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error('[ERR] Async handler caught error:', err.message);
    next(err);
  });
};

export default asyncHandler;