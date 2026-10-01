import * as service from '../services/auth.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import { success } from '../utils/response.js';

export const register = asyncHandler(async (req, res) => success(res, await service.register(req.body), 'Registered', 201));
export const login = asyncHandler(async (req, res) => success(res, await service.login(req.body), 'Logged in'));
