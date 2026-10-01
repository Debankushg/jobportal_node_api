import crypto from 'node:crypto';
import * as applicationRepository from '../repositories/application.repository.js';
import * as jobRepository from '../repositories/job.repository.js';
import * as jobService from './job.service.js';
import { RESUME_DIR, resolveStored } from '../utils/fileStorage.js';
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../constants/index.js';

export const apply = async (jobId, data, file, user) => {
  const job = await jobRepository.findById(jobId);
  if (!job) throw ApiError.notFound('Job not found');
  if (job.status !== 'open') throw ApiError.badRequest('This job is no longer accepting applications');
  if (!file) throw ApiError.badRequest('Resume file is required', [{ in: 'body', field: 'resume', message: 'Upload a PDF, DOC or DOCX' }]);
  const resume = {
    originalName: file.originalname,
    filename: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    key: crypto.randomBytes(16).toString('base64url'),
  };
  return applicationRepository.create({ ...data, resume, job: jobId, candidate: user.id });
};

export const listMine = (user) => applicationRepository.findByCandidate(user.id);

export const listForJob = async (jobId, user) => {
  await jobService.findOwned(jobId, user);
  return applicationRepository.findByJob(jobId);
};

const findOrFail = async (id) => {
  const application = await applicationRepository.findById(id);
  if (!application) throw ApiError.notFound('Application not found');
  return application;
};

export const updateStatus = async (id, status, user) => {
  const application = await findOrFail(id);
  await jobService.findOwned(application.job, user);
  application.status = status;
  return applicationRepository.save(application);
};

export const withdraw = async (id, user) => {
  const application = await findOrFail(id);
  if (user.role !== ROLES.ADMIN && application.candidate.toString() !== user.id) throw ApiError.forbidden('Not your application');
  await applicationRepository.remove(application);
};

export const resumeFile = async (key) => {
  const application = await applicationRepository.findByResumeKey(key);
  if (!application) throw ApiError.notFound('Resume not found');
  return { path: resolveStored(RESUME_DIR, application.resume.filename), ...application.resume.toObject() };
};
