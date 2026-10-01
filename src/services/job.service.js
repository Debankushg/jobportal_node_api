import * as jobRepository from '../repositories/job.repository.js';
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../constants/index.js';
import { getPagination, buildMeta } from '../utils/pagination.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SORTS = { newest: '-createdAt', oldest: 'createdAt', salary: '-salaryMax' };

export const list = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { status: query.status || 'open' };
  if (query.type) filter.type = query.type;
  if (query.location) filter.location = new RegExp(escapeRegex(query.location), 'i');
  if (query.search) filter.$text = { $search: query.search };

  const { items, total } = await jobRepository.findPage({ filter, sort: SORTS[query.sort], skip, limit });
  return { items, meta: buildMeta(page, limit, total) };
};

export const getById = async (id) => {
  const job = await jobRepository.findByIdWithOwner(id);
  if (!job) throw ApiError.notFound('Job not found');
  return job;
};

export const create = (data, user) => jobRepository.create({ ...data, postedBy: user.id });

export const findOwned = async (id, user) => {
  const job = await jobRepository.findById(id);
  if (!job) throw ApiError.notFound('Job not found');
  if (user.role !== ROLES.ADMIN && job.postedBy.toString() !== user.id) throw ApiError.forbidden('You can only modify your own jobs');
  return job;
};

export const update = async (id, data, user) => {
  const job = await findOwned(id, user);
  Object.assign(job, data);
  return jobRepository.save(job);
};

export const remove = async (id, user) => {
  const job = await findOwned(id, user);
  await jobRepository.remove(job);
};
