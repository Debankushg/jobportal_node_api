import mongoose from 'mongoose';
import env from '../config/env.js';
import { APPLICATION_STATUS } from '../constants/index.js';

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coverLetter: { type: String, maxlength: 5000 },
    resume: {
      originalName: { type: String, required: true },
      filename: { type: String, required: true },
      mimeType: { type: String, required: true },
      size: { type: Number, required: true },
      // unguessable id used in the short public link /r/<key>
      key: { type: String, unique: true, sparse: true },
    },
    noticePeriodDays: { type: Number, min: 0, required: true },
    skills: { type: [String], default: [] },
    // 0 = fresher
    experienceYears: { type: Number, min: 0, max: 60, required: true },
    status: { type: String, enum: APPLICATION_STATUS, default: 'applied' },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_d, ret) => {
        delete ret.__v;
        if (ret.resume) {
          // 128-bit random key: the short link is the only credential, so it is not guessable
          const { filename, key, ...resume } = ret.resume;
          ret.resume = { ...resume, ...(key && { candidate_resume_link: `${env.BASE_URL}/r/${key}` }) };
        }
        return ret;
      },
    },
  }
);

// one application per candidate per job
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
applicationSchema.index({ candidate: 1, createdAt: -1 });

export default mongoose.model('Application', applicationSchema);
