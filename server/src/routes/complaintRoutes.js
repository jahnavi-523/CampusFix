import express from 'express';

import {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  confirmComplaintResolution,
  reportComplaintNotFixed,
} from '../controllers/complaintController.js';

import {
  protect,
  authorize,
} from '../middleware/authMiddleware.js';

import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Student submits a complaint with up to 5 images
router.post(
  '/',
  protect,
  authorize('student'),
  upload.array('images', 5),
  createComplaint
);

// Get complaints belonging to the logged-in student
router.get(
  '/my',
  protect,
  authorize('student'),
  getMyComplaints
);

// Confirm repair and close the complaint
router.patch(
  '/:id/confirm',
  protect,
  authorize('student'),
  confirmComplaintResolution
);

// Report that the repair is not complete
router.patch(
  '/:id/not-fixed',
  protect,
  authorize('student'),
  reportComplaintNotFixed
);

// Get one complaint belonging to the logged-in student
router.get(
  '/:id',
  protect,
  authorize('student'),
  getComplaintById
);

export default router;