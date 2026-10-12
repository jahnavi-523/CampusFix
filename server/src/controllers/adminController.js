import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';

// GET /api/admin/complaints
// Admin can view all complaints
export const getAllComplaints = async (req, res) => {
  try {
    const { status, priority, category } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const complaints = await Complaint.find(filter)
      .populate('student', 'name email department')
      .populate('assignedStaff', 'name email department')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error('Get all complaints error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve complaints.',
    });
  }
};

// PATCH /api/admin/complaints/:id/assign
// Admin assigns a complaint to a staff member
export const assignComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint ID.',
      });
    }

    if (!mongoose.isValidObjectId(staffId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid staff ID is required.',
      });
    }

    const staff = await User.findOne({
      _id: staffId,
      role: 'staff',
      isActive: true,
      staffApprovalStatus: { $in: ['approved', 'not_required'] },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Active, approved staff member not found.',
      });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    if (complaint.status === 'Closed') {
      return res.status(400).json({
        success: false,
        message: 'Closed complaints cannot be reassigned.',
      });
    }

    complaint.assignedStaff = staff._id;
    complaint.status = 'Assigned';
    complaint.assignedAt = new Date();

    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('student', 'name email department')
      .populate('assignedStaff', 'name email department');

    return res.status(200).json({
      success: true,
      message: 'Complaint assigned successfully.',
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error('Assign complaint error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to assign complaint.',
    });
  }
};

// GET /api/admin/staff
// Get active staff members for complaint assignment
export const getActiveStaff = async (req, res) => {
  try {
    const staff = await User.find({
      role: 'staff',
      isActive: true,
      staffApprovalStatus: { $in: ['approved', 'not_required'] },
    })
      .select('name email department')
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch (error) {
    console.error('Get active staff error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve staff members.',
    });
  }
};

// GET /api/admin/staff/pending
// Get staff registrations waiting for Admin approval
export const getPendingStaff = async (req, res) => {
  try {
    const staff = await User.find({
      role: 'staff',
      staffApprovalStatus: 'pending',
      isActive: false,
    })
      .select('name email collegeId department staffApprovalStatus createdAt')
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch (error) {
    console.error('Get pending staff error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve pending staff registrations.',
    });
  }
};

// PATCH /api/admin/staff/:id/approve
// Approve staff registration and activate account
export const approveStaff = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID.',
      });
    }

    const staff = await User.findOne({
      _id: id,
      role: 'staff',
      staffApprovalStatus: 'pending',
      isActive: false,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Pending staff registration not found.',
      });
    }

    staff.staffApprovalStatus = 'approved';
    staff.isActive = true;

    await staff.save();

    return res.status(200).json({
      success: true,
      message: 'Staff registration approved successfully.',
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        department: staff.department,
        role: staff.role,
        staffApprovalStatus: staff.staffApprovalStatus,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    console.error('Approve staff error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to approve staff registration.',
    });
  }
};

// PATCH /api/admin/staff/:id/reject
// Reject staff registration and keep account inactive
export const rejectStaff = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID.',
      });
    }

    const staff = await User.findOne({
      _id: id,
      role: 'staff',
      staffApprovalStatus: 'pending',
      isActive: false,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Pending staff registration not found.',
      });
    }

    staff.staffApprovalStatus = 'rejected';
    staff.isActive = false;

    await staff.save();

    return res.status(200).json({
      success: true,
      message: 'Staff registration rejected.',
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        department: staff.department,
        role: staff.role,
        staffApprovalStatus: staff.staffApprovalStatus,
        isActive: staff.isActive,
      },
    });
  } catch (error) {
    console.error('Reject staff error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Unable to reject staff registration.',
    });
  }
};