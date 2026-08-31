import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      enum: ['cloudinary', 'imagekit', 'supabase'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

imageSchema.index({ userId: 1, createdAt: -1 });

const Image = mongoose.model('Image', imageSchema);

export default Image;