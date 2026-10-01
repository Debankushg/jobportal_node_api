import * as userRepository from '../repositories/user.repository.js';
import { ROLES } from '../constants/index.js';
import { AVATAR_DIR, removeStored } from '../utils/fileStorage.js';
import ApiError from '../utils/ApiError.js';
import { getPagination, buildMeta } from '../utils/pagination.js';

export const list = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const { items, total } = await userRepository.findPage({ skip, limit });
  return { items, meta: buildMeta(page, limit, total) };
};

export const getById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const EMPLOYER_ONLY = ['totalEmployees'];
const CANDIDATE_ONLY = ['educationLevel', 'educationField', 'educationInstitution'];
const NOT_ALLOWED_FOR = { [ROLES.EMPLOYER]: CANDIDATE_ONLY, [ROLES.CANDIDATE]: EMPLOYER_ONLY };

export const updateProfile = async (user, data, file) => {
  const forbidden = (NOT_ALLOWED_FOR[user.role] || []).filter((k) => data[k] !== undefined);
  if (forbidden.length)
    throw ApiError.badRequest('Validation failed', forbidden.map((field) => ({ in: 'body', field, message: `Not applicable to the ${user.role} role` })));

  const update = { ...data };
  if (file) update.avatar = `/uploads/avatars/${file.filename}`;
  if (!Object.keys(update).length) throw ApiError.badRequest('Nothing to update');

  const previous = await userRepository.updateById(user.id, update);
  if (!previous) throw ApiError.notFound('User not found');
  if (file) await removeStored(AVATAR_DIR, previous.avatar);
  return userRepository.findById(user.id);
};

export const remove = async (id) => {
  const user = await userRepository.deleteById(id);
  if (!user) throw ApiError.notFound('User not found');
};
