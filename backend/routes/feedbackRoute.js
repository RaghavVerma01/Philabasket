import express from 'express';
import { 
    addFeedback, 
    toggleFeaturedFeedback, 
    getFeaturedFeedback, 
    listAllFeedback, // Add this import
    getUserFeedbacks,
    updateFeedback
} from '../controllers/feedbackController.js';
import upload from '../middleware/multer.js';
import authUser from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const feedbackRouter = express.Router();

// --- USER ROUTES ---
// Multer must come first to parse the body for authUser
feedbackRouter.post('/add', upload.single('image'), authUser, addFeedback);

// --- PUBLIC ROUTES ---
// Fetches only items where isFeatured is true
feedbackRouter.get('/featured', getFeaturedFeedback);
feedbackRouter.get('/user-feedback', authUser, getUserFeedbacks);
// routes/feedbackRouter.js
feedbackRouter.post('/update', adminAuth, updateFeedback);

// --- ADMIN ROUTES ---
// Get every feedback entry (Featured or not) for management
feedbackRouter.get('/list', adminAuth, listAllFeedback);

// Toggle the isFeatured status
feedbackRouter.post('/feature', adminAuth, toggleFeaturedFeedback);

export default feedbackRouter;