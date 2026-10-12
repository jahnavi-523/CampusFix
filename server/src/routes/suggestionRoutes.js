// Suggestion routes placeholder.
import express from 'express';

import {
  createSuggestion,
  getSuggestions,
  getAllSuggestions,
  updateSuggestionStatus,
  voteForSuggestion,
} from '../controllers/suggestionController.js';

import {
  protect,
  authorize,
} from '../middleware/authMiddleware.js';

const router = express.Router();

// Student: Submit a suggestion
router.post(
  '/',
  protect,
  authorize('student'),
  createSuggestion
);

// Student: View suggestions
router.get(
  '/',
  protect,
  authorize('student'),
  getSuggestions
);

// Student: Support a suggestion
router.post(
  '/:id/vote',
  protect,
  authorize('student'),
  voteForSuggestion
);

// Admin: View all suggestions
router.get(
  '/admin',
  protect,
  authorize('admin'),
  getAllSuggestions
);

// Admin: Update suggestion status
router.patch(
  '/admin/:id/status',
  protect,
  authorize('admin'),
  updateSuggestionStatus
);

export default router;