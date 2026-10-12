import express from 'express';

import {
  getMyComplaints,
  getMyComplaintById,
  updateComplaintStatus,
  uploadRepairPhotos,
} from '../controllers/staffController.js';

import {
  protect,
  authorize,
} from '../middleware/authMiddleware.js';

import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes require staff authentication.
router.use(protect);
router.use(authorize('staff'));

// Get complaints assigned to the logged-in staff member.
router.get('/complaints', getMyComplaints);

// Get details of one assigned complaint.
router.get('/complaints/:id', getMyComplaintById);

// Upload repair photos to Cloudinary and save them in MongoDB.
router.post(
  '/complaints/:id/repair-photos',
  upload.array('images', 5),
  uploadRepairPhotos
);

// Update repair status.
router.patch(
  '/complaints/:id/status',
  updateComplaintStatus
);

export default router;