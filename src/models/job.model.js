import mongoose from 'mongoose';
import { JOB_TYPES, JOB_STATUS } from '../constants/index.js';

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    type: { type: String, enum: JOB_TYPES, default: 'full-time' },
    salaryMin: { type: Number, min: 0 },
    salaryMax: { type: Number, min: 0 },
    skills: [{ type: String, trim: true }],
    status: { type: String, enum: JOB_STATUS, default: 'open' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true, toJSON: { transform: (_d, ret) => { delete ret.__v; return ret; } } }
);

jobSchema.index({ title: 'text', description: 'text', company: 'text' });
jobSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Job', jobSchema);
