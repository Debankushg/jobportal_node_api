import fs from 'node:fs';
import path from 'node:path';

const UPLOAD_ROOT = path.resolve('uploads');
export const RESUME_DIR = path.join(UPLOAD_ROOT, 'resumes');
export const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');
fs.mkdirSync(RESUME_DIR, { recursive: true });
fs.mkdirSync(AVATAR_DIR, { recursive: true });

export const resolveStored = (dir, filename) => path.join(dir, path.basename(filename));

// best-effort delete; a missing file is not an error
export const removeStored = (dir, filename) => (filename ? fs.promises.unlink(resolveStored(dir, filename)).catch(() => {}) : undefined);

// removes the file multer saved for this request, used when the request is rejected afterwards
export const discardUpload = (req) => (req.file ? fs.promises.unlink(req.file.path).catch(() => {}) : undefined);
