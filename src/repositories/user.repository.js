import User from '../models/user.model.js';

export const findById = (id) => User.findById(id);
export const findByEmailWithPassword = (email) => User.findOne({ email }).select('+password');
export const existsByEmail = (email) => User.exists({ email });
export const findByEmail = (email) => User.findOne({ email });
export const findByProvider = (provider, providerId) => User.findOne({ providers: { $elemMatch: { provider, providerId } } });
export const save = (user) => user.save();
export const create = (data) => User.create(data);

export const findPage = async ({ skip, limit }) => {
  const [items, total] = await Promise.all([User.find().sort('-createdAt').skip(skip).limit(limit), User.countDocuments()]);
  return { items, total };
};

// resolves to the document as it was BEFORE the update
export const updateById = (id, update) => User.findByIdAndUpdate(id, update, { runValidators: true });
export const deleteById = (id) => User.findByIdAndDelete(id);
