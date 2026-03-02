import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import { getSettings, updateSettings } from '../controllers/adminController.js';

const adminRouter = express.Router();

// Get settings - Public (needed by ShopContext to calculate prices)
adminRouter.get('/settings', getSettings);

// Update settings - Protected (only Admin can change these)
adminRouter.post('/update-settings', adminAuth, updateSettings);

export default adminRouter;