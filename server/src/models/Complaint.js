// Complaint Mongoose model placeholder.
import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      maxlength: 150,
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Electrical',
        'Plumbing',
        'Furniture',
        'Cleanliness',
        'Internet',
        'Classroom',
        'Hostel',
        'Other',
      ],
    },

    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: 15,
      maxlength: 2000,
    },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },

    status: {
      type: String,
      enum: [
        'Pending',
        'Assigned',
        'In Progress',
        'Awaiting Confirmation',
        'Closed',
      ],
      default: 'Pending',
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          default: '',
        },
      },
    ],

    repairPhotos: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          default: '',
        },
      },
    ],

    resolutionNote: {
      type: String,
      default: '',
      maxlength: 1000,
    },

    studentFeedback: {
      type: String,
      default: '',
      maxlength: 1000,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

complaintSchema.index({ status: 1, createdAt: -1 });
complaintSchema.index({ assignedStaff: 1, status: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;