import express from 'express';
import { loginUser, registerUser, adminLogin, getUserProfile ,googleLogin, forgotPassword, resetPassword, listUsers, updateAddress, getPhilatelistDetail, getTopPhilatelists, getAllUsersData, adjustRewardPoints } from '../controllers/userController.js';
import { toggleWishlist, getWishlist } from '../controllers/wishlistController.js';


import authUser from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';
import { getUnifiedHistory } from '../controllers/rewardController.js';


const userRouter = express.Router();


// routes/userRoute.js

userRouter.post('/forgot-password', forgotPassword)
userRouter.post('/reset-password', resetPassword)
userRouter.post('/wishlist-toggle', authUser, toggleWishlist);
userRouter.post('/wishlist-get', authUser, getWishlist);

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.post('/admin', adminLogin);
userRouter.post('/google-login', googleLogin);

userRouter.get('/list', adminAuth, listUsers);

// NEW: This is the route the Navbar and ShopContext call to get points
userRouter.get('/profile', authUser, getUserProfile);
userRouter.post('/update-address', authUser, updateAddress);
userRouter.get('/detail/:userId', adminAuth, getPhilatelistDetail);
userRouter.get('/top-philatelists', adminAuth,getTopPhilatelists);
userRouter.get('/admin-list', adminAuth, getAllUsersData);
userRouter.post('/adjust-points', adminAuth, adjustRewardPoints);


userRouter.get('/reward-history', authUser, getUnifiedHistory);


export default userRouter;