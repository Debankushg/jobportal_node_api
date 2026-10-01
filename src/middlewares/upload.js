import crypto from 'node:crypto';
import multer from 'multer';
import ApiError from '../utils/ApiError.js';
import { RESUME_DIR, AVATAR_DIR, discardUpload } from '../utils/fileStorage.js';

const DOCUMENTS = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};
const IMAGES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const uploader = ({ dir, types, field, maxMb, label }) => {
  const upload = multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${types[file.mimetype]}`),
    }),
    limits: { fileSize: maxMb * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) =>
      types[file.mimetype] ? cb(null, true) : cb(ApiError.badRequest(`${label} must be a ${Object.values(types).join(', ').toUpperCase().replaceAll('.', '')} file`)),
  }).single(field);

  return (req, res, next) =>
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError)
        return next(ApiError.badRequest(err.code === 'LIMIT_FILE_SIZE' ? `${label} must be ${maxMb} MB or smaller` : err.message));
      next(err);
    });
};

export const uploadResume = uploader({ dir: RESUME_DIR, types: DOCUMENTS, field: 'resume', maxMb: 5, label: 'Resume' });
export const uploadAvatar = uploader({ dir: AVATAR_DIR, types: IMAGES, field: 'avatar', maxMb: 2, label: 'Profile image' });

// wraps a validate() middleware so a rejected request does not leave its upload behind
export const cleanupOnInvalid = (validator) => (req, res, next) =>
  validator(req, res, (err) => (err ? Promise.resolve(discardUpload(req)).then(() => next(err)) : next()));
