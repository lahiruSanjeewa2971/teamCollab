import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import errorMiddleware from './middleware/errorMiddleware.js';
import authRoutes from './routes/auth.routes.js';
import teamRoutes from './routes/team.routes.js';
import userRoutes from './routes/user.routes.js';
import notificationRoutes from './routes/notification.routes.js';

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL, credentials: true
}));

app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use(errorMiddleware);

export default app;