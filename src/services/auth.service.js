import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import * as userRepository from '../repositories/user.repository.js';
import ApiError from '../utils/ApiError.js';

export const signToken = (user) => jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

export const register = async (data) => {
  if (await userRepository.existsByEmail(data.email)) throw ApiError.conflict('Email already registered');
  const user = await userRepository.create(data);
  return { user, token: signToken(user) };
};

export const login = async ({ email, password }) => {
  const user = await userRepository.findByEmailWithPassword(email);
  if (user && !user.password) throw ApiError.unauthorized('This account uses social login. Continue with Google, GitHub or LinkedIn.');
  if (!user || !(await user.comparePassword(password))) throw ApiError.unauthorized('Invalid email or password');
  return { user, token: signToken(user) };
};
