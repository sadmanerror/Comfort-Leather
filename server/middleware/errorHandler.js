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

  res.render('pages/error', {
    title: `Error ${statusCode}`,
    statusCode,
    message: err.message || 'An error occurred'
  }, (renderErr, html) => {
    if (renderErr) {
      console.error('[Render Error in Error Handler]:', renderErr.message);
      return res.status(statusCode).send(`
        <div style="font-family:sans-serif;padding:30px;max-width:800px;margin:auto;">
          <h2>Application Error (${statusCode})</h2>
          <p><strong>Message:</strong> ${err.message}</p>
          <pre style="background:#f4f4f4;padding:15px;border-radius:8px;overflow:auto;">${err.stack || ''}</pre>
        </div>
      `);
    }
    res.status(statusCode).send(html);
  });
};

module.exports = {
  notFoundHandler,
  globalErrorHandler
};
