const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activities');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true  
    : 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files - try multiple locations
const publicPath = path.join(__dirname, 'public');
const altPublicPath = path.join(__dirname, '..', 'public');

// Check which public directory exists
const fs = require('fs');
let staticPath;

if (fs.existsSync(publicPath)) {
  staticPath = publicPath;
  console.log('Using public directory:', publicPath);
} else if (fs.existsSync(altPublicPath)) {
  staticPath = altPublicPath;
  console.log('Using public directory:', altPublicPath);
} else {
  console.warn('No public directory found. Creating one...');
  fs.mkdirSync(publicPath);
  staticPath = publicPath;
}

app.use(express.static(staticPath));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carbon-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✓ Connected to MongoDB'))
.catch(err => console.error('✗ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('*', (req, res) => {
  // Don't interfere with API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend files not found');
  }
});

// Serve HTML files with error handling
app.get('/', (req, res) => {
  const indexPath = path.join(staticPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <h1>Welcome to Carbon Footprint Tracker</h1>
      <p>Frontend files not found. Please ensure the following files exist in the public directory:</p>
      <ul>
        <li>index.html</li>
        <li>login.html</li>
        <li>dashboard.html</li>
        <li>script.js</li>
        <li>styles.css</li>
      </ul>
      <p>Expected public directory: <code>${staticPath}</code></p>
      <p><a href="/api/auth/me">Test API</a></p>
    `);
  }
});

app.get('/login', (req, res) => {
  const loginPath = path.join(staticPath, 'login.html');
  if (fs.existsSync(loginPath)) {
    res.sendFile(loginPath);
  } else {
    res.status(404).send(`
      <h1>Login Page Not Found</h1>
      <p>Please create <code>login.html</code> in: <code>${staticPath}</code></p>
      <p><a href="/">Go to Home</a></p>
    `);
  }
});

app.get('/dashboard', (req, res) => {
  const dashboardPath = path.join(staticPath, 'dashboard.html');
  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.status(404).send(`
      <h1>Dashboard Page Not Found</h1>
      <p>Please create <code>dashboard.html</code> in: <code>${staticPath}</code></p>
      <p><a href="/">Go to Home</a></p>
    `);
  }
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Carbon Tracker API is running',
    timestamp: new Date().toISOString(),
    publicPath: staticPath
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Static files served from: ${staticPath}`);
  console.log(`🔗 Login: http://localhost:${PORT}/login`);
  console.log(`🔗 Dashboard: http://localhost:${PORT}/dashboard`);
});