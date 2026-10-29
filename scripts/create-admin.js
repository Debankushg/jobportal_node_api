// Creates (or promotes) an admin account. Admins cannot self-register through the API.
//   npm run create-admin -- you@example.com "Your Name"          (random password is printed once)
//   ADMIN_PASSWORD=... npm run create-admin -- you@example.com   (use your own password)
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import User from '../src/models/user.model.js';
import { ROLES } from '../src/constants/index.js';

const [email = 'admin@jobportal.local', name = 'Admin'] = process.argv.slice(2);
const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
if (password.length < 8 || password.length > 72) throw new Error('Password must be 8-72 characters');

await connectDB();
const existing = await User.findOne({ email: email.toLowerCase() });
if (existing) {
  console.error(`A user with ${email} already exists (role: ${existing.role}). Nothing changed.`);
} else {
  await User.create({ name, email, password, role: ROLES.ADMIN });
  console.log(`Admin created\n  email:    ${email.toLowerCase()}\n  password: ${password}`);
}
await disconnectDB();
await mongoose.disconnect();
