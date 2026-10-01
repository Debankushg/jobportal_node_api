import ApiError from '../utils/ApiError.js';

// schema: { body?, query?, params? } of zod schemas
export default (schema) => (req, _res, next) => {
  const errors = [];
  for (const key of ['body', 'query', 'params']) {
    if (!schema[key]) continue;
    const result = schema[key].safeParse(req[key]);
    if (result.success) {
      if (key === 'query') Object.defineProperty(req, 'query', { value: result.data, writable: true, configurable: true });
      else req[key] = result.data;
    } else {
      errors.push(...result.error.issues.map((i) => ({ in: key, field: i.path.join('.'), message: i.message })));
    }
  }
  next(errors.length ? ApiError.badRequest('Validation failed', errors) : undefined);
};
