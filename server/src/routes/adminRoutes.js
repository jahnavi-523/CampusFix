import express from 'express';

import {
  getAllComplaints,
  assignComplaint,
  getActiveStaff,
  getPendingStaff,
  approveStaff,
  rejectStaff,
} from '../controllers/adminController.js';

import {
  protect,
  authorize,
} from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all complaints — Admin only
router.get(
  '/complaints',
  protect,
  authorize('admin'),
  getAllComplaints
);

// Get active, approved staff — Admin only
router.get(
  '/staff',
  protect,
  authorize('admin'),
  getActiveStaff
);

// Get pending staff registrations — Admin only
router.get(
  '/staff/pending',
  protect,
  authorize('admin'),
  getPendingStaff
);

// Approve staff registration — Admin only
router.patch(
  '/staff/:id/approve',
  protect,
  authorize('admin'),
  approveStaff
);

// Reject staff registration — Admin only
router.patch(
  '/staff/:id/reject',
  protect,
  authorize('admin'),
  rejectStaff
);

// Assign complaint to staff — Admin only
router.patch(
  '/complaints/:id/assign',
  protect,
  authorize('admin'),
  assignComplaint
);

export default router;