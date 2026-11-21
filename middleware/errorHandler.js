const multer = require('multer');

function errorHandler(err, req, res, next) {
  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum file size is 5MB.',
        code: 'FILE_TOO_LARGE',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: err.field || 'Unsupported file type. Allowed types: JPEG, JPG, PNG, WebP.',
        code: 'INVALID_FILE_TYPE',
      });
    }
    return res.status(400).json({
      success: false,
      error: 'File upload error.',
      code: 'UPLOAD_ERROR',
    });
  }

  // Handle API-related errors
  if (err.status === 429 || err.code === 429) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      code: 'RATE_LIMIT',
    });
  }

  if (err.status === 503 || err.code === 503) {
    return res.status(503).json({
      success: false,
      error: 'AI service is temporarily unavailable. Please try again later.',
      code: 'SERVICE_UNAVAILABLE',
    });
  }

  // Generic error — never expose stack traces or API keys
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500
    ? 'An internal server error occurred.'
    : err.message || 'An error occurred.';

  // Sanitize: strip anything that looks like an API key
  const sanitized = message.replace(/AIza[A-Za-z0-9_-]{35}/g, '[REDACTED]');

  res.status(statusCode).json({
    success: false,
    error: sanitized,
    code: 'SERVER_ERROR',
  });
}

module.exports = errorHandler;
