import mongoose from 'mongoose';
import env from './env.js';
import logger from './logger.js';

mongoose.set('strictQuery', true);

export const connectDB = async () => {
  await mongoose.connect(env.MONGO_URI);
  logger.info('MongoDB connected');
};

export const disconnectDB = () => mongoose.disconnect();
