const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');

const env = require('./config/env');
const { connectDB } = require('./config/db');
const Setting = require('./models/Setting');
const Menu = require('./models/Menu');
const User = require('./models/User');
const Product = require('./models/Product');
const { seedData } = require('./seeds/seed');
const { formatBDT } = require('./services/pricingService');
const { optionalAuth } = require('./middleware/auth');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();

const expressLayouts = require('express-ejs-layouts');

// View Engine & Layouts
const viewsPath = path.resolve(process.cwd(), 'views');
app.set('views', viewsPath);
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Security & Optimization Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://images.unsplash.com", "https://placehold.co"],
      mediaSrc: ["'self'", "blob:", "https://res.cloudinary.com"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
const publicPath = path.resolve(process.cwd(), 'public');
app.use(express.static(publicPath, {
  maxAge: env.NODE_ENV === 'production' ? '1d' : 0
}));

// Cheap keep-alive ping route (for Render/Fly free instances)
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Temporary debug endpoint to verify serverless environment and views bundling
app.get('/api/debug-env', (req, res) => {
  const fs = require('fs');
  const mongoose = require('mongoose');
  let viewsExists = false;
  let viewsContents = [];
  try {
    viewsExists = fs.existsSync(viewsPath);
    if (viewsExists) {
      viewsContents = fs.readdirSync(viewsPath);
    }
  } catch (e) {
    viewsContents = [e.message];
  }

  res.json({
    cwd: process.cwd(),
    dirname: __dirname,
    viewsPath,
    viewsExists,
    viewsContents,
    mongoReadyState: mongoose.connection.readyState,
    envNodeEnv: env.NODE_ENV,
    hasMongoUri: !!process.env.MONGODB_URI
  });
});

// Ensure database connection for serverless invocations (cached after cold start)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[MongoDB] Request connection error:', err.message);
    next(err);
  }
});

// Global user authentication extraction & locals injector
app.use(async (req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.formatBDT = formatBDT;
  res.locals.currentUser = null;
  res.locals.user = null;

  // Extract user from JWT cookie if present
  const token = req.cookies?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user) {
        req.user = user;
        res.locals.currentUser = user;
        res.locals.user = user;
      }
    } catch (e) {
      // Invalid token
    }
  }

  // Inject store settings & mega-menu for all storefront views
  try {
    res.locals.settings = await Setting.getSettings();
    res.locals.megaMenu = await Menu.find({ isActive: true }).sort({ displayOrder: 1 });
  } catch (err) {
    res.locals.settings = {};
    res.locals.megaMenu = [];
  }

  next();
});

// Mount Routes
app.use('/admin', require('./routes/adminRoutes'));
app.use('/api', require('./routes/apiRoutes'));
app.use('/', require('./routes/publicRoutes'));

// 404 & Global Error Handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('[Bootstrap] No products detected in database. Automatically initializing seed data...');
      await seedData(false);
    }
    const server = app.listen(env.PORT, () => {
      console.log(`\n========================================================`);
      console.log(`  Comfort Leather Footwear Server is running!`);
      console.log(`  Storefront : ${env.BASE_URL}`);
      console.log(`  Admin Panel: ${env.BASE_URL}/admin`);
      console.log(`  Healthz    : ${env.BASE_URL}/healthz`);
      console.log(`========================================================\n`);
    });
    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
