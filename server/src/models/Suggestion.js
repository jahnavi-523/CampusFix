// Suggestion Mongoose model placeholder.
import mongoose from 'mongoose';

const suggestionSchema = new mongoose.Schema(
  {
    suggestionId: {
      type: String,
      unique: true,
      trim: true,
    },

    title: {
      type: String,
      required: [true, 'Suggestion title is required'],
      trim: true,
      maxlength: 100,
    },

    category: {
      type: String,
      required: [true, 'Suggestion category is required'],
      enum: [
        'Campus Facilities',
        'Cleanliness',
        'Library',
        'Cafeteria',
        'Internet & Wi-Fi',
        'Sports & Recreation',
        'Safety & Security',
        'Other',
      ],
    },

    description: {
      type: String,
      required: [true, 'Suggestion description is required'],
      trim: true,
      minlength: 15,
      maxlength: 1000,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: [
        'Submitted',
        'Under Review',
        'Implemented',
        'Rejected',
      ],
      default: 'Submitted',
    },

    votes: {
      type: Number,
      default: 0,
      min: 0,
    },

    votedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    adminResponse: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Suggestion', suggestionSchema);