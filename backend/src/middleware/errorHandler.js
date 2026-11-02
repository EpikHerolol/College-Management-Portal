export const errorHandler = (err, req, res, next) => {
  console.error('[API Error]:', err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // MySQL specific errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with duplicate unique values already exists.',
      error: err.message
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced entity (foreign key) does not exist.',
      error: err.message
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
};

