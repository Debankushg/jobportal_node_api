import * as service from '../services/job.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';

export const list = asyncHandler(async (req, res) => {
  const { items, meta } = await service.list(req.query);
  success(res, items, 'OK', 200, meta);
});
export const getById = asyncHandler(async (req, res) => success(res, await service.getById(req.params.id)));
export const create = asyncHandler(async (req, res) => success(res, await service.create(req.body, req.user), 'Job created', 201));
export const update = asyncHandler(async (req, res) => success(res, await service.update(req.params.id, req.body, req.user), 'Job updated'));
export const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id, req.user);
  success(res, null, 'Job deleted');
});
