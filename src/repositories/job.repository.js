import Job from '../models/job.model.js';

export const findPage = async ({ filter, sort, skip, limit }) => {
  const [items, total] = await Promise.all([Job.find(filter).sort(sort).skip(skip).limit(limit), Job.countDocuments(filter)]);
  return { items, total };
};

export const findById = (id) => Job.findById(id);
export const findByIdWithOwner = (id) => Job.findById(id).populate('postedBy', 'name email');
export const create = (data) => Job.create(data);
export const save = (job) => job.save();
export const remove = (job) => job.deleteOne();
