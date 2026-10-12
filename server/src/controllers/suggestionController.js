// Suggestions controllers placeholder.
import Suggestion from '../models/Suggestion.js';

// ==========================================
// STUDENT: CREATE SUGGESTION
// ==========================================
export const createSuggestion = async (req, res) => {
  try {
    const { title, category, description } = req.body;

    if (!title?.trim() || !category || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title, category and description are required.',
      });
    }

    if (description.trim().length < 15) {
      return res.status(400).json({
        success: false,
        message: 'Description must contain at least 15 characters.',
      });
    }

    const validCategories = [
      'Campus Facilities',
      'Cleanliness',
      'Library',
      'Cafeteria',
      'Internet & Wi-Fi',
      'Sports & Recreation',
      'Safety & Security',
      'Other',
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid suggestion category.',
      });
    }

    const studentId = req.user?._id || req.user?.id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to submit a suggestion.',
      });
    }

    const suggestion = await Suggestion.create({
      suggestionId: `SUG-${Date.now()}`,
      title: title.trim(),
      category,
      description: description.trim(),
      student: studentId,
    });

    return res.status(201).json({
      success: true,
      message: 'Suggestion submitted successfully.',
      suggestion,
    });
  } catch (error) {
    console.error('Create suggestion error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to submit suggestion.',
    });
  }
};

// ==========================================
// STUDENT: GET ALL SUGGESTIONS
// ==========================================
export const getSuggestions = async (req, res) => {
  try {
    const suggestions = await Suggestion.find()
      .populate('student', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const formattedSuggestions = suggestions.map((suggestion) => ({
      ...suggestion,
      id: suggestion.suggestionId,
      voted: (suggestion.votedBy || []).some(
        (userId) => String(userId) === String(req.user?._id || req.user?.id)
      ),
    }));

    return res.status(200).json({
      success: true,
      count: formattedSuggestions.length,
      suggestions: formattedSuggestions,
    });
  } catch (error) {
    console.error('Get suggestions error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to load suggestions.',
    });
  }
};

// ==========================================
// ADMIN: GET ALL SUGGESTIONS
// ==========================================
export const getAllSuggestions = async (req, res) => {
  try {
    const suggestions = await Suggestion.find()
      .populate('student', 'name email collegeId')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: suggestions.length,
      suggestions,
    });
  } catch (error) {
    console.error('Admin get suggestions error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to load suggestions for admin.',
    });
  }
};

// ==========================================
// ADMIN: UPDATE SUGGESTION STATUS
// ==========================================
export const updateSuggestionStatus = async (req, res) => {
  try {
    const { status, adminResponse = '' } = req.body;

    const validStatuses = [
      'Submitted',
      'Under Review',
      'Implemented',
      'Rejected',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid suggestion status.',
      });
    }

    const suggestion = await Suggestion.findById(req.params.id);

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found.',
      });
    }

    suggestion.status = status;
    suggestion.adminResponse = String(adminResponse).trim();

    await suggestion.save();

    return res.status(200).json({
      success: true,
      message: 'Suggestion status updated successfully.',
      suggestion,
    });
  } catch (error) {
    console.error('Update suggestion status error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to update suggestion status.',
    });
  }
};

// ==========================================
// STUDENT: SUPPORT A SUGGESTION
// ==========================================
export const voteForSuggestion = async (req, res) => {
  try {
    const studentId = req.user?._id || req.user?.id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: 'Please log in to support a suggestion.',
      });
    }

    const suggestion = await Suggestion.findById(req.params.id);

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found.',
      });
    }

    const alreadyVoted = suggestion.votedBy.some(
      (userId) => String(userId) === String(studentId)
    );

    if (alreadyVoted) {
      return res.status(400).json({
        success: false,
        message: 'You have already supported this suggestion.',
      });
    }

    suggestion.votedBy.push(studentId);
    suggestion.votes = suggestion.votedBy.length;

    await suggestion.save();

    return res.status(200).json({
      success: true,
      message: 'Your support has been recorded.',
      suggestion,
    });
  } catch (error) {
    console.error('Vote suggestion error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to support suggestion.',
    });
  }
};