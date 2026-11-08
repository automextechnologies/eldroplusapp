import mongoose from 'mongoose';

const VideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  url: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VideoCategory',
    default: null,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  isPersonal: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  thumbnailUrl: {
    type: String,
    trim: true,
    default: '',
  },
  duration: {
    type: String,
    trim: true,
    default: '',
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

if (mongoose.models.Video && !mongoose.models.Video.schema.path('userId')) {
  mongoose.models.Video.schema.add({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    isPersonal: {
      type: Boolean,
      default: false,
    },
  });
}

export default mongoose.models.Video || mongoose.model('Video', VideoSchema);
