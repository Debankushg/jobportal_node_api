import * as service from '../services/user.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { discardUpload } from '../utils/fileStorage.js';
import { success } from '../utils/response.js';

export const me = asyncHandler(async (req, res) => success(res, req.user));
export const updateMe = asyncHandler(async (req, res) => {
  try {
    success(res, await service.updateProfile(req.user, req.body, req.file), 'Profile updated');
  } catch (err) {
    await discardUpload(req);
    throw err;
  }
});
export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.list(req.query);
  success(res, items, 'OK', 200, meta);
});
export const getById = asyncHandler(async (req, res) => success(res, await service.getById(req.params.id)));
export const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  success(res, null, 'User deleted');
});
