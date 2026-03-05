import express from 'express'
import {placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, verifyStripe, verifyRazorpay, getAdminDashboardStats, getDetailedAnalytics,cancelOrder, syncLegacyOrderDetails, singleOrder, updateInvoiceStatus} from '../controllers/orderController.js'
import adminAuth  from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'


const orderRouter = express.Router()

// Admin Features
orderRouter.post('/list',adminAuth,allOrders)
orderRouter.post('/status',adminAuth,updateStatus)
orderRouter.post('/cancel', authUser, cancelOrder);

// Payment Features
orderRouter.post('/place',authUser,placeOrder)
orderRouter.post('/stripe',authUser,placeOrderStripe)
orderRouter.post('/razorpay',authUser,placeOrderRazorpay)

// User Feature 
orderRouter.post('/userorders',authUser,userOrders)

// verify payment
orderRouter.post('/verifyStripe',authUser, verifyStripe)
orderRouter.post('/verifyRazorpay',authUser, verifyRazorpay)
orderRouter.get('/admin-stats', adminAuth, getAdminDashboardStats);
orderRouter.get('/detailed-analytics', adminAuth, getDetailedAnalytics);
orderRouter.post('/single', adminAuth, singleOrder);
orderRouter.post('/update-invoice', adminAuth, updateInvoiceStatus);

orderRouter.post('/migrate-legacy-data', adminAuth, syncLegacyOrderDetails);



export default orderRouter