import Application from '../models/application.model.js';

export const create = (data) => Application.create(data);
export const findById = (id) => Application.findById(id);
export const findByResumeKey = (key) => Application.findOne({ 'resume.key': key }).select('resume');

export const findByCandidate = (candidateId) =>
  Application.find({ candidate: candidateId }).sort('-createdAt').populate('job', 'title company location status');

export const findByJob = (jobId) => Application.find({ job: jobId }).sort('-createdAt').populate('candidate', 'name email');

export const save = (application) => application.save();
export const remove = (application) => application.deleteOne();
