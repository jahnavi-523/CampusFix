import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import { protect, authorize } from './middleware/authMiddleware.js';
import complaintRoutes from './routes/complaintRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import suggestionRoutes from './routes/suggestionRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'FixMyCampus API is running!',
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Protected route: Get logged-in user details
app.get('/api/auth/me', protect, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Admin-only test route
app.get(
  '/api/admin/test',
  protect,
  authorize('admin'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Admin access granted.',
    });
  }
);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/suggestions', suggestionRoutes);
// 404 handler — MUST be the last route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});

// Start server after database connection
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`FixMyCampus server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();