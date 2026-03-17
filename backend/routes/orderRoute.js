import express from 'express'
import {placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, verifyStripe, verifyRazorpay, getAdminDashboardStats, getDetailedAnalytics,cancelOrder, syncLegacyOrderDetails, singleOrder, updateInvoiceStatus, emailInvoiceToUser, updateOrderItems, placeOrderInstamojo, verifyInstamojo, createManualOrder} from '../controllers/orderController.js'
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
// orderRoute.js
orderRouter.post('/razorpay', authUser, placeOrderRazorpay);
orderRouter.post('/verifyRazorpay', authUser, verifyRazorpay);

// User Feature 
orderRouter.post('/userorders',authUser,userOrders)
// Change this line in orderRouter.js
orderRouter.post('/userordersadmin', adminAuth, userOrders)
// orderRouter.js
orderRouter.post('/email-invoice', adminAuth, emailInvoiceToUser);

// verify payment
orderRouter.post('/verifyStripe',authUser, verifyStripe)

orderRouter.get('/admin-stats', adminAuth, getAdminDashboardStats);
orderRouter.get('/detailed-analytics', adminAuth, getDetailedAnalytics);
orderRouter.post('/single', adminAuth, singleOrder);
orderRouter.post('/update-invoice', adminAuth, updateInvoiceStatus);
orderRouter.post('/update-items', adminAuth, updateOrderItems);
orderRouter.post('/migrate-legacy-data', adminAuth, syncLegacyOrderDetails);
// Instamojo Payment Routes
orderRouter.post('/instamojo', authUser, placeOrderInstamojo);
orderRouter.post('/verifyInstamojo', authUser, verifyInstamojo);
orderRouter.post('/create-manual', adminAuth, createManualOrder);



export default orderRouter