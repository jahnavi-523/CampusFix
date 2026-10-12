import cloudinary from '../config/cloudinary.js';
import Complaint from '../models/Complaint.js';

// Upload buffered images to Cloudinary.
// If an upload fails, remove any images uploaded during this request.
const uploadImagesToCloudinary = async (files = [], folder) => {
  const uploadedImages = [];

  try {
    for (const file of files) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
          },
          (error, uploadResult) => {
            if (error) return reject(error);
            resolve(uploadResult);
          }
        );

        stream.end(file.buffer);
      });

      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    return uploadedImages;
  } catch (error) {
    await Promise.allSettled(
      uploadedImages.map((image) =>
        cloudinary.uploader.destroy(image.publicId)
      )
    );

    throw error;
  }
};

// @desc Submit a new complaint
// @route POST /api/complaints
// @access Student
export const createComplaint = async (req, res) => {
  let uploadedImages = [];

  try {
    const {
      title,
      category,
      location,
      description,
      priority,
    } = req.body;

    if (
      typeof title !== 'string' ||
      !title.trim() ||
      typeof category !== 'string' ||
      !category ||
      typeof location !== 'string' ||
      !location.trim() ||
      typeof description !== 'string' ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, location and description are required.',
      });
    }

    if (title.trim().length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Title cannot exceed 150 characters.',
      });
    }

    if (description.trim().length < 15) {
      return res.status(400).json({
        success: false,
        message: 'Description must contain at least 15 characters.',
      });
    }

    if (description.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 2000 characters.',
      });
    }

    const allowedCategories = [
      'Electrical',
      'Plumbing',
      'Furniture',
      'Cleanliness',
      'Internet',
      'Classroom',
      'Hostel',
      'Other',
    ];

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint category.',
      });
    }

    const allowedPriorities = ['Low', 'Medium', 'High', 'Urgent'];

    if (priority && !allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint priority.',
      });
    }

    const files = req.files || [];

    if (files.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'You can upload a maximum of 5 images.',
      });
    }

    // Upload images before creating the database record.
    uploadedImages = await uploadImagesToCloudinary(
      files,
      'campusfix/complaints'
    );

    const complaintId = `CMP-${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const complaint = await Complaint.create({
      complaintId,
      title: title.trim(),
      category,
      location: location.trim(),
      description: description.trim(),
      priority: priority || 'Medium',
      student: req.user.id,
      status: 'Pending',
      images: uploadedImages,
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      complaint,
    });
  } catch (error) {
    // Avoid orphaned Cloudinary files if the database save fails.
    if (uploadedImages.length) {
      await Promise.allSettled(
        uploadedImages.map((image) =>
          cloudinary.uploader.destroy(image.publicId)
        )
      );
    }

    console.error('Create complaint error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to submit complaint. Please try again.',
    });
  }
};

// @desc Get complaints submitted by the logged-in student
// @route GET /api/complaints/my
// @access Student
export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      student: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error('Get my complaints error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve complaints.',
    });
  }
};

// @desc Get one complaint owned by the logged-in student
// @route GET /api/complaints/:id
// @access Student
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      student: req.user.id,
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    return res.status(200).json({
      success: true,
      complaint,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID.',
      });
    }

    console.error('Get complaint error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve complaint.',
    });
  }
};

// @desc Student confirms repair completion
// @route PATCH /api/complaints/:id/confirm
// @access Student
export const confirmComplaintResolution = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      student: req.user.id,
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    if (complaint.status !== 'Awaiting Confirmation') {
      return res.status(400).json({
        success: false,
        message: 'Only complaints awaiting confirmation can be closed.',
      });
    }

    complaint.status = 'Closed';
    complaint.closedAt = new Date();

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: 'Repair confirmed. Complaint closed successfully.',
      complaint,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID.',
      });
    }

    console.error('Confirm complaint error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to confirm complaint resolution.',
    });
  }
};

// @desc Student reports that repair is incomplete
// @route PATCH /api/complaints/:id/not-fixed
// @access Student
export const reportComplaintNotFixed = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      student: req.user.id,
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    if (complaint.status !== 'Awaiting Confirmation') {
      return res.status(400).json({
        success: false,
        message: 'Only complaints awaiting confirmation can be reopened.',
      });
    }

    complaint.status = 'In Progress';
    complaint.closedAt = null;
    complaint.resolvedAt = null;

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: 'Complaint reopened for further repair.',
      complaint,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID.',
      });
    }

    console.error('Reopen complaint error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to reopen complaint.',
    });
  }
};