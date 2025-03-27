const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Import routes
const userRoutes = require("./routes/userRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const voteRoutes = require("./routes/voteRoutes");

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' })); // Add size limit for request body

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',          // Local development
      'http://localhost:3000',          // Alternative local port
      'http://127.0.0.1:5173',         // Local development alternative
      'http://127.0.0.1:3000',         // Local development alternative
      process.env.FRONTEND_URL,        // Production frontend URL
      'https://secure-voting-gdg.netlify.app', // Netlify frontend
      'https://backend-k4h8.vercel.app' // Vercel backend
    ].filter(Boolean); // Remove any undefined values
    
    // Check if the origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// MongoDB Connection with improved options and retry logic
const connectDB = async () => {
  try {
    console.log("🔄 Attempting to connect to MongoDB...");
    console.log("📝 Connection URI:", process.env.MONGO_URI ? "URI is set" : "URI is not set");
    console.log("🌍 Environment:", process.env.NODE_ENV);

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 5
    };

    // Add additional options for Atlas connection
    if (process.env.MONGO_URI.includes('mongodb+srv://')) {
      options.ssl = true;
      options.retryWrites = true;
      options.w = 'majority';
      console.log("🔒 Using Atlas connection with SSL");
    }

    const connection = await mongoose.connect(process.env.MONGO_URI, options);
    console.log(`✅ Successfully connected to MongoDB!`);
    console.log(`📊 Database Name: ${connection.connection.name}`);
    console.log(`🔌 Host: ${connection.connection.host}`);
    console.log(`🔄 Connection State: ${connection.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Test the connection by listing collections
    const collections = await connection.connection.db.listCollections().toArray();
    console.log("📚 Available Collections:", collections.map(c => c.name));
    
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("🔍 Error details:", {
      name: err.name,
      code: err.code,
      stack: err.stack
    });
    // Retry connection after 5 seconds
    console.log("🔄 Retrying connection in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

// Add connection event listeners
mongoose.connection.on('error', err => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

connectDB();

// Test Routes
app.get("/", (req, res) => {
  res.json({ message: "🚀 Secure Voting API is Running!" });
});

app.get("/api", (req, res) => {
  res.json({ message: "🚀 Secure Voting API is Running!" });
});

// Add MongoDB connection test endpoint
app.get("/api/test-db", async (req, res) => {
  try {
    const connectionState = mongoose.connection.readyState;
    const state = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[connectionState];

    const collections = await mongoose.connection.db.listCollections().toArray();
    
    res.json({
      status: 'success',
      message: 'MongoDB Connection Test',
      connectionState: state,
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      collections: collections.map(c => c.name),
      environment: process.env.NODE_ENV,
      mongoUriSet: !!process.env.MONGO_URI
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'MongoDB Connection Test Failed',
      error: error.message,
      connectionState: mongoose.connection.readyState,
      environment: process.env.NODE_ENV,
      mongoUriSet: !!process.env.MONGO_URI
    });
  }
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/votes", voteRoutes);

// Authentication Middleware with token expiration check
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token, access denied" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: "Token has expired" });
        }
        return res.status(403).json({ message: "Invalid token" });
      }
      
      // Check token expiration
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return res.status(401).json({ message: "Token has expired" });
      }
      
      req.userId = decoded.voterId;
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Protect voting route
app.post("/api/votes/vote", authenticate, (req, res) => {
  res.json({ message: "Vote recorded!" });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'MongoError') {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'Duplicate key error',
        field: Object.keys(err.keyPattern)[0]
      });
    }
    return res.status(500).json({
      message: 'Database Error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start Server only if not in serverless environment
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

// Export for serverless
module.exports = app;
