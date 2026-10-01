import mongoose from 'mongoose';
import env from '../config/env.js';
import logger from '../config/logger.js';
import ApiError from '../utils/ApiError.js';

export const notFound = (req, _res, next) => next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (err instanceof mongoose.Error.CastError) error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  else if (err instanceof mongoose.Error.ValidationError)
    error = ApiError.badRequest('Validation failed', Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })));
  else if (err.code === 11000) error = ApiError.conflict(`Duplicate value for: ${Object.keys(err.keyValue || {}).join(', ')}`);
  else if (err.type === 'entity.parse.failed') error = ApiError.badRequest('Malformed JSON body');

  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) (req.log || logger).error({ err }, 'Unhandled error');

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    ...(error.errors && { errors: error.errors }),
    ...(env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  });
};
