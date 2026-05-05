import express from 'express';
import { authenticate } from '../../middleware/auth';
import { AnalyticsControllers } from './analytics.controller';

const router = express.Router();

router.get('/dashboard', authenticate, AnalyticsControllers.getDashboardAnalytics);

export const AnalyticsRoutes = router;
