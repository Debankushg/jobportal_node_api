import * as service from '../services/application.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { discardUpload } from '../utils/fileStorage.js';
import { success } from '../utils/response.js';

export const apply = asyncHandler(async (req, res) => {
  try {
    success(res, await service.apply(req.params.jobId, req.body, req.file, req.user), 'Application submitted', 201);
  } catch (err) {
    await discardUpload(req);
    throw err;
  }
});
export const listMine = asyncHandler(async (req, res) => success(res, await service.listMine(req.user)));
export const listForJob = asyncHandler(async (req, res) => success(res, await service.listForJob(req.params.jobId, req.user)));
export const updateStatus = asyncHandler(async (req, res) =>
  success(res, await service.updateStatus(req.params.id, req.body.status, req.user), 'Status updated'));
export const withdraw = asyncHandler(async (req, res) => {
  await service.withdraw(req.params.id, req.user);
  success(res, null, 'Application withdrawn');
});
export const downloadResume = asyncHandler(async (req, res) => {
  const file = await service.resumeFile(req.params.key);
  res.type(file.mimeType);
  res.sendFile(file.path, { headers: { 'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"` } }, (err) => {
    if (err && !res.headersSent) res.status(404).json({ success: false, message: 'Resume file not found' });
  });
});
