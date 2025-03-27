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
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, "https://secure-voting-gdg.netlify.app"]
    : ["http://localhost:5173"],
  credentials: true
}));

// MongoDB Connection with improved options
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Test Route
app.get("/", (req, res) => {
  res.send("🚀 Secure Voting API is Running!");
});

// Routes
app.use("/users", userRoutes);
app.use("/candidates", candidateRoutes);
app.use("/votes", voteRoutes);

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
app.post("/votes/vote", authenticate, (req, res) => {
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

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
