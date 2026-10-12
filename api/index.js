const { app } = require('../server/index');
const { connectDB } = require('../server/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Vercel Handler] Database connection failed:', err.message);
  }
  return app(req, res);
};
