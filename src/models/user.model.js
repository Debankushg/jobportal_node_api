import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import env from '../config/env.js';
import { ROLES, EDUCATION_LEVELS } from '../constants/index.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    // profile image for candidates, company logo for employers
    avatar: { type: String },
    phone: { type: String, trim: true },
    about: { type: String, trim: true, maxlength: 1000 },
    address: { type: String, trim: true, maxlength: 300 },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    // employer only
    totalEmployees: { type: Number, min: 1 },
    // candidate only
    educationLevel: { type: String, enum: EDUCATION_LEVELS },
    educationField: { type: String, trim: true },
    educationInstitution: { type: String, trim: true },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CANDIDATE },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        if (ret.avatar) ret.avatar = `${env.BASE_URL}${ret.avatar}`;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function hash() {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function compare(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
