require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  BASE_URL: process.env.BASE_URL || 'http://localhost:5000',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stepup_shoes',
  JWT_SECRET: process.env.JWT_SECRET || 'stepup_super_secret_jwt_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    API_KEY: process.env.CLOUDINARY_API_KEY || '',
    API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
    IS_CONFIGURED: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  },
  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM: process.env.SMTP_FROM || '"StepUp Shoes" <noreply@stepupshoes.com>',
    IS_CONFIGURED: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
  },
  SSLCOMMERZ: {
    STORE_ID: process.env.SSLCOMMERZ_STORE_ID || '',
    STORE_PASS: process.env.SSLCOMMERZ_STORE_PASS || '',
    IS_SANDBOX: process.env.SSLCOMMERZ_IS_SANDBOX !== 'false',
    IS_ENABLED: !!(process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASS)
  }
};
