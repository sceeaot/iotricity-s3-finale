import mongoose from 'mongoose';

const EventTimerSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global_timer',
      unique: true,
      index: true,
    },
    durationSeconds: {
      type: Number,
      default: 3 * 3600, // 3 hours = 10,800 seconds
    },
    remainingSeconds: {
      type: Number,
      default: 3 * 3600,
    },
    status: {
      type: String,
      enum: ['idle', 'running', 'paused', 'expired'],
      default: 'idle',
    },
    endsAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.EventTimer || mongoose.model('EventTimer', EventTimerSchema);
