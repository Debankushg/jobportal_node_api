import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { AVATAR_DIR } from './utils/fileStorage.js';
import env from './config/env.js';
import logger from './config/logger.js';
import swaggerSpec from './config/swagger.js';
import resumeLinkRoutes from './routes/resumeLink.routes.js';
import routes from './routes/index.js';
import { apiLimiter } from './middlewares/rateLimit.js';
import { notFound, errorHandler } from './middlewares/error.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Swagger UI needs inline scripts, so it is mounted before helmet's strict CSP
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'Job Portal API Docs' }));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','), credentials: true }));
app.use(compression());
app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url.endsWith('/health') },
    // one short line per request instead of dumping every header
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  }),
);
// public profile images / company logos (resumes are intentionally not served)
app.use('/uploads/avatars', express.static(AVATAR_DIR, { index: false, setHeaders: (res) => res.set('Cross-Origin-Resource-Policy', 'cross-origin') }));
app.use(express.json({ limit: '1mb' }));

app.use('/r', apiLimiter, resumeLinkRoutes);
app.use('/api/v1', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
