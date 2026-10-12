import Complaint from '../models/Complaint.js';
import cloudinary from '../config/cloudinary.js';

/* ---------------------------------------
   Helper: Upload repair photos to Cloudinary
--------------------------------------- */

const uploadImagesToCloudinary = async (files = []) => {
  const uploadedPhotos = [];

  try {
    for (const file of files) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'campusfix/repair-photos',
            resource_type: 'image',
          },
          (error, uploadResult) => {
            if (error) {
              return reject(error);
            }

            resolve(uploadResult);
          }
        );

        stream.end(file.buffer);
      });

      uploadedPhotos.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    return uploadedPhotos;
  } catch (error) {
    // Remove photos uploaded before a later upload failed.
    await Promise.allSettled(
      uploadedPhotos.map((photo) =>
        cloudinary.uploader.destroy(photo.publicId)
      )
    );

    throw error;
  }
};

/* ---------------------------------------
   Helper: Remove Cloudinary photos
--------------------------------------- */

const deleteCloudinaryPhotos = async (photos = []) => {
  await Promise.allSettled(
    photos
      .filter((photo) => photo.publicId)
      .map((photo) =>
        cloudinary.uploader.destroy(photo.publicId)
      )
  );
};

/* ---------------------------------------
   GET assigned complaints
   GET /api/staff/complaints
--------------------------------------- */

export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      assignedStaff: req.user.id,
    })
      .populate('student', 'name email department')
      .populate('assignedStaff', 'name email department')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error(
      'Get staff complaints error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned complaints.',
    });
  }
};

/* ---------------------------------------
   GET one assigned complaint
   GET /api/staff/complaints/:id
--------------------------------------- */

export const getMyComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      assignedStaff: req.user.id,
    })
      .populate('student', 'name email department')
      .populate('assignedStaff', 'name email department');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or not assigned to you.',
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

    console.error(
      'Get staff complaint error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch complaint details.',
    });
  }
};

/* ---------------------------------------
   UPDATE complaint status
   PATCH /api/staff/complaints/:id/status

   Allowed statuses:
   - In Progress
   - Awaiting Confirmation
--------------------------------------- */

export const updateComplaintStatus = async (req, res) => {
  try {
    const { status, resolutionNote } = req.body;

    const allowedStatuses = [
      'In Progress',
      'Awaiting Confirmation',
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          'Allowed statuses are In Progress and Awaiting Confirmation.',
      });
    }

    if (
      resolutionNote !== undefined &&
      (
        typeof resolutionNote !== 'string' ||
        resolutionNote.trim().length > 1000
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Resolution note must be a string of at most 1000 characters.',
      });
    }

    const complaint = await Complaint.findOne({
      _id: req.params.id,
      assignedStaff: req.user.id,
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or not assigned to you.',
      });
    }

    // Start repair only for assigned complaints.
    if (
      status === 'In Progress' &&
      !['Assigned', 'In Progress'].includes(complaint.status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Only assigned complaints can be moved to In Progress.',
      });
    }

    // Repair must already be in progress.
    if (
      status === 'Awaiting Confirmation' &&
      complaint.status !== 'In Progress'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Start the repair before requesting confirmation.',
      });
    }

    // Start repair.
    if (status === 'In Progress') {
      if (!complaint.startedAt) {
        complaint.startedAt = new Date();
      }

      complaint.status = 'In Progress';
    }

    // Submit completed repair for student confirmation.
    if (status === 'Awaiting Confirmation') {
      if (
        typeof resolutionNote !== 'string' ||
        !resolutionNote.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Add a resolution note before requesting confirmation.',
        });
      }

      if (!complaint.repairPhotos?.length) {
        return res.status(400).json({
          success: false,
          message:
            'Upload at least one repair photo before requesting confirmation.',
        });
      }

      complaint.status = 'Awaiting Confirmation';
      complaint.resolutionNote = resolutionNote.trim();
      complaint.resolvedAt = new Date();
    } else if (resolutionNote !== undefined) {
      complaint.resolutionNote = resolutionNote.trim();
    }

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: 'Complaint status updated successfully.',
      complaint,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID.',
      });
    }

    console.error(
      'Update complaint status error:',
      error.message
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to update complaint status.',
    });
  }
};

/* ---------------------------------------
   UPLOAD repair photos
   POST /api/staff/complaints/:id/repair-photos
--------------------------------------- */

export const uploadRepairPhotos = async (req, res) => {
  let uploadedPhotos = [];

  try {
    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one repair photo.',
      });
    }

    const complaint = await Complaint.findOne({
      _id: req.params.id,
      assignedStaff: req.user.id,
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found or not assigned to you.',
      });
    }

    if (complaint.status !== 'In Progress') {
      return res.status(400).json({
        success: false,
        message:
          'Start the repair before uploading repair photos.',
      });
    }

    const existingPhotoCount =
      complaint.repairPhotos?.length || 0;

    if (existingPhotoCount + files.length > 5) {
      return res.status(400).json({
        success: false,
        message:
          'A maximum of 5 repair photos is allowed per complaint.',
      });
    }

    // Upload selected files to Cloudinary.
    uploadedPhotos = await uploadImagesToCloudinary(files);

    // Save Cloudinary URLs and public IDs in MongoDB.
    complaint.repairPhotos.push(...uploadedPhotos);

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: 'Repair photos uploaded successfully.',
      repairPhotos: complaint.repairPhotos,
      complaint,
    });
  } catch (error) {
    // Clean up uploaded files if the database operation fails.
    if (uploadedPhotos.length > 0) {
      await deleteCloudinaryPhotos(uploadedPhotos);
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID.',
      });
    }

    console.error('Repair photo upload error:', {
  message: error.message,
  name: error.name,
  http_code: error.http_code,
  error: error.error?.message,
});

    return res.status(500).json({
      success: false,
      message: 'Unable to upload repair photos.',
    });
  }
};