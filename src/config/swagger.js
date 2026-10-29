import swaggerJsdoc from 'swagger-jsdoc';
import env from './env.js';

export default swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Job Portal API',
      version: '1.0.0',
      description: 'REST API for the Job Portal. Authenticate via /auth/login, then click "Authorize" and paste the token.',
    },
    servers: [{ url: `${env.BASE_URL}/api/v1`, description: env.NODE_ENV === 'production' ? 'Production' : 'Local' }],
    tags: [
      { name: 'Auth' },
      { name: 'Users' },
      { name: 'Jobs' },
      { name: 'Applications' },
      { name: 'Health' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['candidate', 'employer', 'admin'] },
            avatar: { type: 'string', format: 'uri', description: 'Profile image / company logo link' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Job: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            company: { type: 'string' },
            location: { type: 'string' },
            type: { type: 'string', enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'] },
            salaryMin: { type: 'number' },
            salaryMax: { type: 'number' },
            skills: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['open', 'closed'] },
            postedBy: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Application: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            job: { type: 'string' },
            candidate: { type: 'string' },
            coverLetter: { type: 'string' },
            resume: { type: 'object', properties: { candidate_resume_link: { type: 'string', format: 'uri', description: 'Short link to the resume file' }, originalName: { type: 'string' }, mimeType: { type: 'string' }, size: { type: 'integer' } } },
            noticePeriodDays: { type: 'integer' },
            experienceYears: { type: 'number', description: '0 = fresher' },
            skills: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['applied', 'reviewing', 'shortlisted', 'rejected', 'hired'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        Unauthorized: { description: 'Missing or invalid token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        Forbidden: { description: 'Insufficient permissions', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        NotFound: { description: 'Resource not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        ValidationError: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      },
    },
  },
  apis: ['./src/routes/*.js'],
});
