import pino from 'pino';
import env from './env.js';

export default pino({
  level: env.LOG_LEVEL,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  transport:
    env.NODE_ENV === 'development' ? { target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname,req,res' } } : undefined,
});
