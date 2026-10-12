const notFoundHandler = (req, res, next) => {
  if (req.originalUrl.startsWith('/api/') || req.xhr) {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }
  res.status(404).render('pages/error', {
    title: 'Page Not Found - 404',
    statusCode: 404,
    message: 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.'
  });
};

const globalErrorHandler = (err, req, res, next) => {
  console.error('[Error]', err.stack || err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  if (req.originalUrl.startsWith('/api/') || req.xhr) {
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal Server Error'
    });
  }

  try {
    res.status(statusCode).render('pages/error', {
      title: `Error ${statusCode}`,
      statusCode,
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please try again later.'
        : err.message
    });
  } catch (renderErr) {
    res.status(statusCode).send(`Error ${statusCode}: ${err.message || 'Internal Server Error'}`);
  }
};

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
