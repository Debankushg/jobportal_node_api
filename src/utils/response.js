
export const success = (res, data, message = 'OK', statusCode = 200, meta) =>
  res.status(statusCode).json({ success: true, message, data, ...(meta && { meta }) });
