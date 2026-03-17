import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import Stripe from 'stripe';
import razorpay from 'razorpay';
import { sendEmail } from "../config/email.js";
import twilio from 'twilio';
import 'dotenv/config';
import axios from 'axios';
import rewardTransactionModel from "../models/rewardTranscationModel.js";
import userRewardModel from "../models/userRewardModel.js";
import settingsModel from "../models/settingModel.js";

import { rewardReferrer } from "./userController.js";
import Razorpay from 'razorpay';
import crypto from 'crypto'; // Built-in Node module

import dotenv from 'dotenv'

dotenv.config()

// orderController.js

// controllers/orderController.js



// controllers/orderController.js
export const createManualOrder = async (req, res) => {
    try {
        const { email, items, deliveryFee, address, name, isNewUser } = req.body;

        let user = await userModel.findOne({ email: email.toLowerCase().trim() });

        // If user doesn't exist and isNewUser is true, create them
        if (!user && isNewUser) {
            user = new userModel({
                name: name || address.firstName,
                email: email.toLowerCase().trim(),
                password: Math.random().toString(36).slice(-8), // Temporary password
                defaultAddress: address
            });
            await user.save();
        } else if (!user) {
            return res.json({ success: false, message: "Collector not found. Please enable 'New Collector' mode." });
        }

        const subtotal = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);

        const orderData = {
            userId: user._id,
            items,
            amount: subtotal + (Number(deliveryFee) || 0),
            address,
            deliveryFee: Number(deliveryFee) || 0,
            date: Date.now(),
            status: "Order Placed",
            payment: true
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        res.json({ success: true, message: "Order & User Registry Updated", orderNo: newOrder.orderNo });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};





export const placeOrderInstamojo = async (req, res) => {
    try {
        const { 
            userId, items, amount, address, billingAddress, 
            currency, pointsUsed, couponUsed, discountAmount, 
            deliveryMethod 
        } = req.body;

        // 1. FETCH REGISTRY SETTINGS (Critical for Fees)
        const settings = await settingsModel.findOne({}) || { 
            rate: 83, 
            indiaFee: 125, indiaFeeFast: 250, 
            globalFee: 750, globalFeeFast: 1500 
        };

        // 2. CALCULATE DELIVERY FEE
        const isIndia = address.country.toLowerCase() === 'india';
        const method = deliveryMethod === 'fast' ? 'fast' : 'standard';

        let deliveryFee = 0;
        if (isIndia) {
            deliveryFee = method === 'fast' ? settings.indiaFeeFast : settings.indiaFee;
        } else {
            deliveryFee = method === 'fast' ? settings.globalFeeFast : settings.globalFee;
        }

        // Apply Free Shipping override (Standard India orders >= 4999)
        const cartAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        if (isIndia && method === 'standard' && cartAmount >= 4999) {
            deliveryFee = 0;
        }

        // 3. GENERATE OAUTH2 ACCESS TOKEN
        const authEndpoint = 'https://api.instamojo.com/oauth2/token/'; 
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', process.env.INSTAMOJO_CLIENT_ID);
        params.append('client_secret', process.env.INSTAMOJO_CLIENT_SECRET);

        const authResponse = await axios.post(authEndpoint, params);
        const accessToken = authResponse.data.access_token;

        // 4. CONSTRUCT COMPLETE ORDER DATA
        const orderData = {
            userId,
            items,
            address,
            billingAddress: billingAddress || address,
            deliveryFee, // ✅ Now captured
            deliveryMethod: method,
            amount, // Total payable amount from frontend
            pointsUsed: pointsUsed || 0,
            couponUsed: couponUsed || null,
            discountAmount: discountAmount || 0,
            currency: currency || 'INR',
            exchangeRate: settings.rate,
            paymentMethod: "Instamojo",
            payment: false,
            date: Date.now(),
            status: 'Awaiting Payment'
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        // 5. CREATE INSTAMOJO PAYMENT REQUEST
        const paymentEndpoint = 'https://api.instamojo.com/v2/payment_requests/';
        
        const paymentRequestData = {
            purpose: `PhilaBasket Order #${newOrder.orderNo}`,
            amount: amount,
            buyer_name: `${address.firstName} ${address.lastName}`,
            email: address.email,
            phone: address.phone,
            // Pass the Order ID in the redirect URL for verification later
            redirect_url: `${process.env.FRONTEND_URL}/verify-instamojo?orderId=${newOrder._id}`,
            send_email: true,
            allow_repeated_payments: false,
        };

        const paymentResponse = await axios.post(paymentEndpoint, paymentRequestData, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        res.json({ 
            success: true, 
            payment_url: paymentResponse.data.longurl 
        });

    } catch (error) {
        console.error("Instamojo Protocol Error:", error.response?.data || error.message);
        res.json({ success: false, message: "By instamojo protocol make payment above rupees 9" });
    }
};

// Initialize with your keys
// Instamojo.setKeys(process.env.INSTAMOJO_API_KEY, process.env.INSTAMOJO_AUTH_TOKEN);
// Instamojo.isSandboxMode(true); // Change to false for production

// const placeOrderInstamojo = async (req, res) => {
//     try {
//         const { userId, items, amount, address, deliveryMethod } = req.body;

//         // 1. Fetch registry protocols for delivery fee verification
//         const settings = await settingsModel.findOne({}) || { indiaFee: 125, indiaFeeFast: 250 };
        
//         // 2. Create the Order in your DB as 'Pending'
//         const orderData = {
//             userId,
//             items,
//             address,
//             amount,
//             deliveryMethod,
//             paymentMethod: "Instamojo",
//             payment: false,
//             date: Date.now(),
//             status: 'Awaiting Payment'
//         };

//         const newOrder = new orderModel(orderData);
//         await newOrder.save();

//         // 3. Prepare Instamojo Payment Request
//         const data = new Instamojo.PaymentData();
//         data.purpose = `PhilaBasket Acquisition #${newOrder.orderNo}`;
//         data.amount = amount;
//         data.buyer_name = `${address.firstName} ${address.lastName}`;
//         data.email = address.email;
//         data.phone = address.phone;
//         data.redirect_url = `${process.env.FRONTEND_URL}/verify-instamojo?orderId=${newOrder._id}`;
//         data.allow_repeated_payments = false;

//         Instamojo.createPayment(data, (error, response) => {
//             if (error) {
//                 return res.json({ success: false, message: "Instamojo Protocol Failed" });
//             }
//             // response contains longurl (the payment link)
//             const paymentResponse = JSON.parse(response);
//             res.json({ success: true, payment_url: paymentResponse.payment_request.longurl });
//         });

//     } catch (error) {
//         res.json({ success: false, message: error.message });
//     }
// };

export const verifyInstamojo = async (req, res) => {
    try {
        const { orderId, paymentId } = req.body;

        // 1. Get Access Token (Same as above)
        // 2. Call GET https://api.instamojo.com/v2/payments/{paymentId}/
        // 3. Check if status is 'successful'
        
        // If successful:
        const orderInfo = await orderModel.findByIdAndUpdate(orderId, {
            $set: { payment: true, status: 'Order Placed' }
        });

        // Standard Post-Order Logistics (Stock, Cart, Email)
        for (const item of orderInfo.items) {
            await productModel.findByIdAndUpdate(item._id, { $inc: { stock: -item.quantity } });
        }
        await userModel.findByIdAndUpdate(orderInfo.userId, { $set: { cartData: {} } });

        res.json({ success: true, message: "Registry Updated" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const recordRewardActivity = async (userId, userEmail, amount, type, orderId = null) => {
    try {
        // 1. Update the User's live balance
        await userModel.findByIdAndUpdate(userId, { 
            $inc: { totalRewardPoints: amount } 
        });

        // 2. Create the Archive Ledger Entry
        const transaction = new rewardTransactionModel({
            userEmail: userEmail,
            actionType: type, // 'earn_point' or 'redeem_point'
            rewardAmount: Math.abs(amount),
            orderId: orderId,
            createdAt: new Date()
        });
        await transaction.save();
    } catch (error) {
        console.error("Ledger Sync Failed:", error);
    }
};


// --- CONFIGURATION ---
const deliveryCharge = 100;
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;


// --- UTILITIES ---
const sendWhatsAppAlert = async (orderData) => {
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    const message = `📦 *New Order Received!* \n\n` +
                    `👤 *Customer:* ${orderData.address.firstName} ${orderData.address.lastName}\n` +
                    `💰 *Amount:* ${orderData.currency} ${orderData.amount}\n` +
                    `📍 *Location:* ${orderData.address.city}, ${orderData.address.state}\n` +
                    `📄 *Items:* ${orderData.items.length} items.`;
    try {
        await client.messages.create({ from: 'whatsapp:+14155238886', to: `whatsapp:${process.env.OWNER_PHONE}`, body: message });
    } catch (error) { console.error("WhatsApp Alert Failed:", error); }
};

// backend/controllers/orderController.js

export const getTrackingStatus = async (req, res) => {
    try {
        const { trackingNumber } = req.body;
        
        // backend/controllers/trackingController.js
const options = {
    method: 'POST',
    url: 'https://speedpost-tracking-api-for-india-post.p.rapidapi.com/track/consignment',
    timeout: 30000, // <--- Add this (30 seconds)
    headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-rapidapi-host': 'speedpost-tracking-api-for-india-post.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPID_API_KEY 
    },
    data: new URLSearchParams({ consignment_number: trackingNumber })
};

        const response = await axios.request(options);
        res.json({ success: true, data: response.data });
    } catch (error) {
        res.json({ success: false, message: "Tracking Registry Offline" });
    }
};

const getOrderHtmlTemplate = (orderData, activeFee = null, trackingNumber = null) => {
    const { 
        address, 
        items, 
        amount, 
        paymentMethod, 
        orderNo, 
        date, 
        pointsUsed, 
        couponUsed, 
        discountAmount,
        deliveryFee 
    } = orderData;

    const symbol = '₹';
    const accentColor = "#BC002D"; 
    const secondaryColor = "#1a1a1a";
    const bgColor = "#FCF9F4";

    // --- LOGIC CALCULATIONS ---
    const rawSubtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const gstAmount = rawSubtotal * 0.05;
    
    // Logic: Only apply the 5% PB discount if it was actually part of the price calculation
    const pbExclusiveDiscount = (rawSubtotal * 0.05);
    const pointsValue = pointsUsed ? pointsUsed / 10 : 0; 

    // --- SHIPPING FEE RESOLUTION ---
    const finalFee = activeFee !== null ? activeFee : (deliveryFee || 0);
    const isFreeShipping = amount >= 4999;
    const shippingDisplay = isFreeShipping 
        ? `<span style="color: #2e7d32; font-weight: 900;">COMPLIMENTARY</span>` 
        : `${symbol}${Number(finalFee).toFixed(2)}`;

    // --- TIER CONFIGURATION ---
    const TIER_CONFIG = {
        'Platinum': { color: '#06b6d4', bg: '#ecfeff', next: 0, icon: '◈', perks: ['20% Rewards', 'Free Shipping', 'Priority Curation'] },
        'Gold': { color: '#f59e0b', bg: '#fffbeb', next: 50000, icon: '✦', perks: ['15% Rewards', 'Early Archive Access', 'Birthday Specimens'] },
        'Silver': { color: '#64748b', bg: '#f8fafc', next: 30000, icon: '○', perks: ['10% Rewards', 'Standard Support', 'Registry Access'] }
    };

    const userTier = orderData.userId?.tier || 'Silver';
    const tier = TIER_CONFIG[userTier];
    const userPoints = orderData.userId?.totalRewardPoints || 0;
    const pointsToNext = tier.next > 0 ? (tier.next - userPoints) : 0;

    const itemRows = items.map(item => `
        <tr style="border-bottom: 1px solid #eeeeee;">
            <td style="padding: 12px 0;">
                <p style="margin: 0; font-weight: bold; color: ${secondaryColor}; font-size: 13px;">${item.name}</p>
                <p style="margin: 4px 0 0 0; color: #999; font-size: 10px; text-transform: uppercase;">Specimen HSN: 9704</p>
            </td>
            <td style="padding: 12px 0; text-align: center; color: ${secondaryColor}; font-weight: bold; font-size: 13px;">x${item.quantity}</td>
            <td style="padding: 12px 0; text-align: right; color: ${secondaryColor}; font-weight: bold; font-size: 13px;">${symbol}${item.price.toLocaleString('en-IN')}</td>
        </tr>`).join('');

    return `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: ${secondaryColor};">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${bgColor}; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
                        <tr>
                            <td style="background-color: ${accentColor}; padding: 30px; text-align: center;">
                                <img src="https://res.cloudinary.com/darmvywhd/image/upload/v1773258449/lat_ut1ao6.png" width="60" style="margin-bottom: 10px;"/>
                                <h1 style="color: #ffffff; margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 4px; font-weight: 900;">PhilaBasket</h1>
                                <p style="color: rgba(255,255,255,0.7); margin: 5px 0 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">Registry & Acquisition Services</p>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 20px 40px 0 40px;">
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${tier.bg}; border-radius: 12px; border: 1px solid ${tier.color}30;">
                                    <tr>
                                        <td style="padding: 15px 20px;">
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td>
                                                        <span style="color: ${tier.color}; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">Collector Rank</span>
                                                        <h3 style="margin: 2px 0; color: ${secondaryColor}; font-size: 16px;">${tier.icon} ${userTier} Member</h3>
                                                    </td>
                                                    <td align="right">
                                                        ${pointsToNext > 0 ? `<p style="margin: 0; font-size: 10px; color: #64748b;"><strong>${pointsToNext.toLocaleString()} pts</strong> to upgrade</p>` : `<p style="margin: 0; font-size: 10px; color: ${tier.color}; font-weight: 900;">PREMIER STATUS</p>`}
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 900;">Acquisition ${trackingNumber ? 'Dispatched' : 'Successful'}</h2>
                                <p style="font-size: 14px; color: #666;">Salutations, ${address.firstName},</p>
                                <p style="font-size: 14px; color: #666; line-height: 1.5;">
                                    ${trackingNumber 
                                        ? `Your curated specimens are in transit. Consignment ID: <strong style="color:${secondaryColor}">${trackingNumber}</strong>.` 
                                        : `Your acquisition request has been logged in our central registry. Our curators are currently finalizing your specimens for dispatch.`}
                                </p>

                                <table width="100%" style="margin: 25px 0; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; padding: 15px 0;">
                                    <tr>
                                        <td><span style="font-size: 9px; color: #bbb; text-transform: uppercase; font-weight: bold;">Order Registry No.</span><br><strong style="font-size: 14px;">#${orderNo}</strong></td>
                                        <td align="right"><span style="font-size: 9px; color: #bbb; text-transform: uppercase; font-weight: bold;">Registry Date</span><br><strong style="font-size: 14px;">${new Date(date).toLocaleDateString('en-IN')}</strong></td>
                                    </tr>
                                </table>

                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <thead>
                                        <tr style="text-align: left; font-size: 10px; color: #bbb; text-transform: uppercase;">
                                            <th style="padding-bottom: 10px;">Asset Details</th>
                                            <th style="padding-bottom: 10px; text-align: center;">Qty</th>
                                            <th style="padding-bottom: 10px; text-align: right;">Valuation</th>
                                        </tr>
                                    </thead>
                                    <tbody>${itemRows}</tbody>
                                </table>

                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                                    <tr>
                                        <td width="70%" style="padding: 5px 0; font-size: 13px; color: #888;">Asset Subtotal</td>
                                        <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: bold;">${symbol}${rawSubtotal.toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0; font-size: 13px; color: #888;">GST Protocol (5%)</td>
                                        <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: bold;">${symbol}${gstAmount.toLocaleString('en-IN')}</td>
                                    </tr>
                                    
                                    ${pbExclusiveDiscount > 0 ? `
                                    <tr>
                                        <td style="padding: 5px 0; font-size: 13px; color: #2e7d32; font-weight: bold;">PB Exclusive Discount</td>
                                        <td align="right" style="padding: 5px 0; font-size: 13px; color: #2e7d32; font-weight: bold;">- ${symbol}${pbExclusiveDiscount.toLocaleString('en-IN')}</td>
                                    </tr>` : ''}

                                    ${discountAmount > 0 ? `
                                    <tr>
                                        <td style="padding: 5px 0; font-size: 13px; color: #2e7d32; font-weight: bold;">Coupon: ${couponUsed}</td>
                                        <td align="right" style="padding: 5px 0; font-size: 13px; color: #2e7d32; font-weight: bold;">- ${symbol}${discountAmount.toLocaleString('en-IN')}</td>
                                    </tr>` : ''}

                                    ${pointsUsed > 0 ? `
                                    <tr>
                                        <td style="padding: 5px 0; font-size: 13px; color: ${accentColor}; font-weight: bold;">Archive Credits (${pointsUsed} pts)</td>
                                        <td align="right" style="padding: 5px 0; font-size: 13px; color: ${accentColor}; font-weight: bold;">- ${symbol}${pointsValue.toLocaleString('en-IN')}</td>
                                    </tr>` : ''}

                                    <tr>
                                        <td style="padding: 5px 0; font-size: 13px; color: #888;">Registry Shipping</td>
                                        <td align="right" style="padding: 5px 0; font-size: 13px; font-weight: bold;">${shippingDisplay}</td>
                                    </tr>
                                    
                                    <tr>
                                        <td style="padding: 20px 0 0 0; font-size: 15px; font-weight: 900; text-transform: uppercase; border-top: 2px solid #000;">Total Valuation</td>
                                        <td align="right" style="padding: 20px 0 0 0; font-size: 20px; font-weight: 900; color: ${accentColor}; border-top: 2px solid #000;">${symbol}${amount.toLocaleString('en-IN')}</td>
                                    </tr>
                                </table>

                                <table width="100%" style="margin-top: 40px; border-top: 1px dashed #eee; padding-top: 20px;">
                                    <tr>
                                        <td width="50%" valign="top">
                                            <h4 style="margin: 0 0 8px 0; font-size: 10px; color: #bbb; text-transform: uppercase; letter-spacing: 1px;">Shipping Destination</h4>
                                            <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #444;">
                                                <strong>${address.firstName} ${address.lastName}</strong><br>
                                                ${address.street}<br>
                                                ${address.city}, ${address.state} ${address.zipcode || address.zipCode}
                                            </p>
                                        </td>
                                        <td width="50%" valign="top">
                                            <h4 style="margin: 0 0 8px 0; font-size: 10px; color: #bbb; text-transform: uppercase; letter-spacing: 1px;">Payment Method</h4>
                                            <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #444;">${paymentMethod}</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <tr>
                            <td style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                                <p style="margin: 0; font-size: 10px; color: #bbb;">PhilaBasket © 2024 • Authentic Philatelic Registry</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
};

const updateStock = async (items, type = "reduce") => {
    for (const item of items) {
        const quantity = type === "reduce" ? -item.quantity : item.quantity;
        await productModel.findByIdAndUpdate(item._id || item.productId, { $inc: { stock: quantity } });
    }
};

// --- CONTROLLERS ---


// import userRewardModel from "../models/userRewardModel.js"; // Ensure this path is correct

export const emailInvoiceToUser = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        // Populate userId to ensure we have an email fallback
        const order = await orderModel.findById(orderId).populate('userId');

        if (!order) {
            return res.json({ success: false, message: "Registry Record not found" });
        }

        // Generate the HTML template
        const emailHtml = getOrderHtmlTemplate(order, order.deliveryFee, order.trackingNumber);

        // Dispatched via Resend Utility
        const result = await sendEmail(
            order.address.email || order.userId.email,
            `Acquisition Registry: Order #${order.orderNo}`,
            emailHtml
        );

        if (result.success) {
            res.json({ success: true, message: "Invoice dispatched to collector via Resend" });
        } else {
            // Log the specific error for Render debugging
            res.json({ success: false, message: "Logistics dispatch failed", error: result.error });
        }
    } catch (error) {
        console.error("Controller Error:", error);
        res.json({ success: false, message: error.message });
    }
};





// backend/controllers/orderController.js

const placeOrder = async (req, res) => {
    try {
        const { 
            userId, items, amount, address, billingAddress, 
            currency, pointsUsed, couponUsed, discountAmount, 
            paymentMethod, status, deliveryFee, 
            deliveryMethod // Pull the new selection from the frontend
        } = req.body;

        // 1. FETCH UPDATED REGISTRY PROTOCOLS
        const settings = await settingsModel.findOne({}) || { 
            rate: 83, 
            indiaFee: 125, indiaFeeFast: 250, 
            globalFee: 750, globalFeeFast: 1500 
        };

        // 2. CALCULATE EXPECTED FEE BASED ON 4-WAY MATRIX
        const isIndia = address.country.toLowerCase() === 'india';
        const method = deliveryMethod === 'fast' ? 'fast' : 'standard';

        let expectedFee = 0;
        if (isIndia) {
            expectedFee = method === 'fast' ? settings.indiaFeeFast : settings.indiaFee;
        } else {
            expectedFee = method === 'fast' ? settings.globalFeeFast : settings.globalFee;
        }

        // Apply Free Shipping override for Standard Domestic orders >= 4999 if applicable
        const cartAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        if (isIndia && method === 'standard' && cartAmount >= 4999) {
            expectedFee = 0;
        }

        // Valuation Safety Check
        if (Number(deliveryFee) !== expectedFee) {
            console.error(`Valuation Mismatch: Expected ${expectedFee}, received ${deliveryFee}`);
        }

        // 3. BLOCK DOUBLE COUPON USAGE
        if (couponUsed) {
            const alreadyUsed = await userRewardModel.findOne({ 
                discountCode: couponUsed, 
                email: address.email, 
                status: 'used' 
            });

            if (alreadyUsed) {
                return res.json({ 
                    success: false, 
                    message: `Security Alert: Coupon ${couponUsed} has already been recorded.` 
                });
            }
        }

        // 4. CONSTRUCT ORDER DATA WITH DELIVERY METHOD
        const orderData = {
            userId,
            items,
            address,
            deliveryFee: expectedFee,
            deliveryMethod: method, // Explicitly save chosen method
            billingAddress: billingAddress || address,
            amount,
            pointsUsed: pointsUsed || 0,
            couponUsed: couponUsed || null,
            discountAmount: discountAmount || 0,
            currency: currency || 'INR',
            exchangeRate: settings.rate,
            paymentMethod: paymentMethod || "COD", 
            payment: false,
            date: Date.now(),
            status: status || (paymentMethod === 'Cheque' ? 'Cheque on Hold' : 'Order Placed')
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save(); 

        // 5. POST-ORDER LOGIC (Rewards, Inventory, Cart)
        if (couponUsed) {
            const usedEntry = new userRewardModel({
                email: address.email,
                rewardName: "Coupon Redeemed",
                description: `Acquisition Discount via ${couponUsed}`,
                discountValue: discountAmount,
                discountCode: couponUsed,
                status: 'used',
                createdAt: new Date()
            });
            await usedEntry.save();
        }

        if (pointsUsed > 0) {
            await recordRewardActivity(userId, address.email, -Math.abs(pointsUsed), 'redeem_point', newOrder._id);
        }

        for (const item of items) {
            await productModel.findByIdAndUpdate(item._id, { $inc: { stock: -item.quantity } });
        }

        await userModel.findByIdAndUpdate(userId, { $set: { cartData: {} } });

        // 6. TRIGGER NOTIFICATIONS
        try {
            const emailSubject = orderData.paymentMethod === 'Cheque' 
                ? "Order Received - Awaiting Cheque" 
                : "Order Confirmation";
            
            // Pass deliveryMethod to template if needed for UI priority badges
            const htmlContent = getOrderHtmlTemplate(newOrder.toObject(), expectedFee);
            await sendEmail(address.email, emailSubject, htmlContent);
        } catch (emailError) {
            console.error("Email notification failed:", emailError);
        }

        await sendWhatsAppAlert(orderData);

        res.json({ 
            success: true, 
            message: paymentMethod === 'Cheque' 
                ? "Acquisition secured. Awaiting cheque clearance." 
                : "Order Placed & Confirmation Sent.", 
            orderNo: newOrder.orderNo 
        });

    } catch (error) {
        console.error("Order Placement Error:", error.message);
        res.json({ success: false, message: error.message });
    }
};


        




const cancelOrder = async (req, res) => {
    try {
        // userId comes from the authUser middleware, orderId from the body
        const { orderId, userId } = req.body; 
        
        const order = await orderModel.findById(orderId);
        
        if (!order) {
            return res.json({ success: false, message: "Registry Entry not found." });
        }

        // BLOCK: Prevent cancellation if already in transit
        const blockedStatuses = ['Shipped', 'Out for delivery', 'Delivered', 'Cancelled'];
        if (blockedStatuses.includes(order.status)) {
            return res.json({ success: false, message: `Cannot cancel: Order is currently ${order.status}` });
        }

        // 1. Update Status
        await orderModel.findByIdAndUpdate(orderId, { status: 'Cancelled' });
        
        // 2. Restore Stock
        await updateStock(order.items, "restore");

        // 3. Refund points (Record as 'earn_point' to show as a positive refund in ledger)
        if (order.pointsUsed > 0) {
            const user = await userModel.findById(userId);
            // This will increment the user's balance back and add a ledger entry
            await recordRewardActivity(userId, user.email, order.pointsUsed, 'earn_point', orderId);
        }

        res.json({ success: true, message: "Acquisition terminated. Points restored to Vault." });
    } catch (error) { 
        res.json({ success: false, message: error.message }); 
    }
};

const updateSoldCount = async (items) => {
    for (const item of items) {
        // Increment soldCount by the quantity purchased
        await productModel.findByIdAndUpdate(item._id || item.productId, { 
            $inc: { soldCount: item.quantity } 
        });
    }
};

// API to update order items and total amount (Admin only)
export const updateOrderItems = async (req, res) => {
    try {
        const { orderId, items, amount } = req.body;

        // 1. Validation
        if (!orderId || !items || items.length === 0) {
            return res.json({ success: false, message: "Invalid Registry Data" });
        }

        // 2. Update the document
        // We use the $set operator to ensure other fields (like address/status) remain untouched
        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            { 
                items: items, 
                amount: Number(amount) 
            },
            { new: true } // Returns the updated document
        );

        if (!updatedOrder) {
            return res.json({ success: false, message: "Order not found in Archives" });
        }

        res.json({ 
            success: true, 
            message: "Archive Registry Updated", 
            order: updatedOrder 
        });

    } catch (error) {
        console.error("Registry Sync Error:", error);
        res.json({ success: false, message: error.message });
    }
};



const updateStatus = async (req, res) => {
    try {
        // --- Added courierProvider to destructuring ---
        const { orderId, status, trackingNumber, shippedDate, courierProvider } = req.body;
        
        const currentOrder = await orderModel.findById(orderId).populate('userId');
        if (!currentOrder) {
            return res.json({ success: false, message: "Order not found" });
        }

        let finalStatus = (trackingNumber && (status === 'Order Placed' || status === 'Packing')) ? 'Shipped' : status;
        const updateFields = { status: finalStatus };
        
        if (trackingNumber) updateFields.trackingNumber = trackingNumber;
        
        // --- Added courierProvider to update fields ---
        if (courierProvider) updateFields.courierProvider = courierProvider;

        if (shippedDate) {
            updateFields.shippedDate = new Date(shippedDate).getTime();
        }

        // --- Workflow Reversal Logic ---
        if (finalStatus === 'Order Placed' && currentOrder.status !== 'Order Placed') {
            updateFields.trackingNumber = "";
            updateFields.shippedDate = null;
            updateFields.courierProvider = ""; // Clear courier on reset

            try {
                await sendEmail(
                    currentOrder.address.email, 
                    "Order Confirmation Update", 
                    getOrderHtmlTemplate(currentOrder)
                );
            } catch (emailError) {
                console.error("Order Placed Email Failed:", emailError);
            }
        }

        // --- Shipping Logic (with Courier Info) ---
        if (finalStatus === 'Shipped' && currentOrder.status !== 'Shipped') {
            await rewardReferrer(currentOrder); 
            try {
                // Pass courierProvider to the template so the email shows "Via India Post" or "Via DTDC"
                await sendEmail(
                    currentOrder.address.email, 
                    "Items Shipped", 
                    getOrderHtmlTemplate(
                        currentOrder, 
                        null, 
                        trackingNumber || currentOrder.trackingNumber,
                        courierProvider || currentOrder.courierProvider // New argument for template
                    )
                );
            } catch (emailError) {
                console.error("Shipping Email Failed:", emailError);
            }
        }

        // --- Reward Logic (Delivered) ---
        if (finalStatus === 'Complete' && currentOrder.status !== 'Complete') {
            updateFields.payment = true;
            const itemSubtotal = currentOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const userTier = currentOrder.userId?.tier || 'Silver';
            let multiplier = 0.10; 
            if (userTier === 'Gold') multiplier = 0.30;
            if (userTier === 'Platinum') multiplier = 0.50;
        
            const earnedPoints = Math.floor(itemSubtotal * multiplier);
            await recordRewardActivity(currentOrder.userId._id, currentOrder.address.email, earnedPoints, 'earn_point', currentOrder._id);
        }

        await orderModel.findByIdAndUpdate(orderId, updateFields);

        res.json({ success: true, message: "Status Updated", currentStatus: finalStatus });

    } catch (error) { 
        console.error("Status Update Error:", error);
        res.json({ success: false, message: error.message }); 
    }
};

// --- ANALYTICS ---

const getDetailedAnalytics = async (req, res) => {
    try {
        const filter = { $or: [{ payment: true }, { status: "Delivered" }] };
        const recentOrders = await orderModel.find(filter).sort({ date: -1 }).limit(10).populate('userId', 'email totalRewardPoints referralCount referralCode').lean();

        const topBuyers = await orderModel.aggregate([
            { $match: filter },
            { $group: { _id: "$userId", totalSpent: { $sum: "$amount" }, orderCount: { $sum: 1 } } },
            { $lookup: { from: "users", let: { oId: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$_id", { $toObjectId: "$$oId" }] } } }], as: "u" } },
            { $unwind: "$u" },
            { $project: { name: "$u.name", email: "$u.email", referralCount: "$u.referralCount", totalSpent: 1, orderCount: 1 } },
            { $sort: { totalSpent: -1 } }, { $limit: 10 }
        ]);
        res.json({ success: true, recentOrders, topBuyers });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

const getAdminDashboardStats = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        const users = await userModel.find({});
        const deliveredOrders = orders.filter(o => o.status === 'Delivered');

        // Total Revenue (Direct Sum)
        const totalRevenue = deliveredOrders.reduce((acc, o) => acc + (o.amount || 0), 0);

        // Top Selling Product
        const pSales = {};
        deliveredOrders.forEach(o => o.items.forEach(i => pSales[i.name] = (pSales[i.name] || 0) + i.quantity));
        const topProduct = Object.entries(pSales).map(([name, qty]) => ({ name, qty })).sort((a,b) => b.qty - a.qty)[0] || { name: "N/A", qty: 0 };

        const salesTrendData = await orderModel.aggregate([
            { $match: { status: "Delivered" } },
            {
                $project: {
                    dateStr: { 
                        $dateToString: { 
                            format: "%Y-%m-%d", 
                            date: { $add: [new Date(0), "$date"] } 
                        } 
                    },
                    amount: "$amount"
                }
            },
            {
                $group: { 
                    _id: "$dateStr", 
                    sales: { $sum: "$amount" }, 
                    orders: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } } 
        ]);
        
        // Inside the stats object in res.json:
        // salesTrend: salesTrend.map(s => ({ 
        //     date: s._id, // This will be "2026-01-30", "2026-01-31", etc.
        //     sales: s.sales, 
        //     orders: s.orders 
        // }))

        res.json({ success: true, stats: { 
            totalRevenue, 
            orderCount: deliveredOrders.length, 
            totalUsers: users.length, 
            topProduct, 
            totalReferrals: users.reduce((acc, u) => acc + (u.referralCount || 0), 0),
            totalSystemPoints: users.reduce((acc, u) => acc + (u.totalRewardPoints || 0), 0),
            salesTrend: salesTrendData.map(s => ({ 
                date: s._id, // Sends "2026-01-31" to fix "Invalid Date"
                sales: s.sales, 
                orders: s.orders 
            }))
        }});
    } catch (error) { res.json({ success: false, message: error.message }); }
};

const allOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, sort, search, date } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // 1. Initial Filters
        let matchQuery = {};
        if (status && status !== "ALL") {
            // Check if status contains multiple values (e.g., "Complete,Delivered")
            if (status.includes(',')) {
                const statusArray = status.split(',');
                matchQuery.status = { $in: statusArray }; // Matches any status in the array
            } else {
                matchQuery.status = status;
            }
        }
        
        
        
        if (date) {
            const start = new Date(date).setHours(0, 0, 0, 0);
            const end = new Date(date).setHours(23, 59, 59, 999);
            matchQuery.date = { $gte: start, $lte: end };
        }

        // 2. Build Pipeline
        let pipeline = [
            { $match: matchQuery },
            {
                $lookup: {
                    from: "users", // Must match your DB collection name
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } }
        ];

        // 3. Search Logic
        if (search) {
            const searchRegex = new RegExp(search.trim(), 'i');
            const searchNumber = Number(search.trim());

            let orConditions = [
                { "userDetails.name": searchRegex },
                { "address.firstName": searchRegex },
                { "address.lastName": searchRegex }
            ];

            // Only query orderNo if the search input is a valid number
            if (!isNaN(searchNumber)) {
                orConditions.push({ orderNo: searchNumber });
            }

            pipeline.push({ $match: { $or: orConditions } });
        }

        // 4. Sort Logic
        let sortOrder = { date: -1 };
        if (search) sortOrder = { orderNo: 1, date: -1 };
        else if (sort === 'DATE_ASC') sortOrder = { date: 1 };
        else if (sort === 'AMOUNT') sortOrder = { amount: -1 };
        
        pipeline.push({ $sort: sortOrder });

        // 5. Execute with Stats
        const [orders, statsData] = await Promise.all([
            orderModel.aggregate([
                ...pipeline,
                { $skip: skip },
                { $limit: parseInt(limit) }
            ]),
            orderModel.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $ne: ["$status", "Cancelled"] }, "$amount", 0] } } } }
            ])
        ]);

        const totalResult = await orderModel.aggregate([...pipeline, { $count: "total" }]);
        const totalOrdersCount = totalResult.length > 0 ? totalResult[0].total : 0;

        res.json({
            success: true,
            orders,
            totalOrders: totalOrdersCount,
            stats: {
                revenue: statsData.reduce((acc, curr) => acc + curr.revenue, 0),
                ...statsData.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {})
            }
        });

    } catch (error) {
        console.error("Search Fix Error:", error);
        res.json({ success: false, message: error.message });
    }
};

const userOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.body.userId });
        res.json({ success: true, orders });
    } catch (error) { res.json({ success: false, message: error.message }); }
};



// ... (Rest of Analytics and Verification logic remain as provided)


// controllers/orderController.js

const verifyStripe = async (req, res) => {
};

const verifyRazorpay = async (req, res) => {
    try {
        const { userId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // 1. Verify Signature (Security Protocol)
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (expectedSign !== razorpay_signature) {
            return res.json({ success: false, message: "Security Authentication Failed" });
        }

        // 2. Find specific order by Razorpay Order ID
        const orderInfo = await orderModel.findOne({ razorpayOrderId: razorpay_order_id });

        if (!orderInfo) {
            return res.json({ success: false, message: "Order not found in registry" });
        }

        if (orderInfo.payment) {
            return res.json({ success: true, message: "Already verified" });
        }

        // 3. Mark as Paid & Update Stock
        orderInfo.payment = true;
        await orderInfo.save();

        // 4. Update Registry Inventory (Stock reduction)
        for (const item of orderInfo.items) {
            await productModel.findByIdAndUpdate(item._id, { $inc: { stock: -item.quantity } });
        }

        // 5. Clear User Cart & Deduct Reward Points if used
        const updateData = { $set: { cartData: {} } };
        if (orderInfo.pointsUsed > 0) {
            updateData.$inc = { totalRewardPoints: -orderInfo.pointsUsed };
        }
        await userModel.findByIdAndUpdate(userId, updateData);

        // 6. Dispatch Confirmations
        const htmlContent = getOrderHtmlTemplate(orderInfo.toObject(), orderInfo.deliveryFee);
        await sendEmail(orderInfo.address.email, "Acquisition Confirmed", htmlContent);

        res.json({ success: true, message: "Acquisition Logged Successfully" });

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const placeOrderRazorpay = async (req, res) => {
    try {
        const { 
            userId, items, amount, address, billingAddress, 
            currency, activeExchangeRate, pointsUsed, 
            couponUsed, discountAmount, deliveryMethod 
        } = req.body;

        // 1. Fetch Admin Settings for Fees (Fallbacks)
        const settings = await settingsModel.findOne({}) || { 
            rate: 83, 
            indiaFee: 125, indiaFeeFast: 250, 
            globalFee: 750, globalFeeFast: 1500 
        };

        // PROTOCOL: Use the live rate from frontend if available, otherwise DB
        const currentRate = activeExchangeRate || settings.rate || 83; 

        // 2. Save Order to Database (Storing base INR amount for your accounting)
        const orderData = {
            userId,
            items,
            address,
            billingAddress: billingAddress || address,
            deliveryFee, // ✅ Now captured
            deliveryMethod: method,
            amount, 
            pointsUsed: pointsUsed || 0,
            couponUsed: couponUsed || null,
            discountAmount: discountAmount || 0,
            currency: currency || 'INR',
            paymentMethod: "RAZORPAY",
            payment: false,
            date: Date.now(),
            status: 'Order Placed'
        };

        const newOrder = new orderModel(orderData);
        await newOrder.save();

        // 3. PREPARE RAZORPAY OPTIONS
        let razorpayAmount;
        let razorpayCurrency = currency === 'USD' ? 'USD' : 'INR';

        if (currency === 'USD') {
            // MATH: (INR Amount / Live Exchange Rate) * 100 Cents
            // Example: (244 / 83.45) * 100 = 292.39 -> 292 cents ($2.92)
            const usdAmount = amount / currentRate;
            razorpayAmount = Math.round(usdAmount * 100); 
        } else {
            // MATH: INR * 100 Paise
            razorpayAmount = Math.round(amount * 100);
        }

        const options = {
            amount: razorpayAmount, 
            currency: razorpayCurrency,
            receipt: newOrder._id.toString(),
        };

        // 4. Create Razorpay Order
        razorpayInstance.orders.create(options, async (error, order) => {
            if (error) {
                console.error("Razorpay Order Error:", error);
                return res.json({ success: false, message: error.description || "Razorpay Error" });
            }
            
            // CRITICAL: Save the Razorpay Order ID to our DB for verification later
            await orderModel.findByIdAndUpdate(newOrder._id, { razorpayOrderId: order.id });
            
            // This 'order' object now contains the CORRECT amount and currency for the popup
            res.json({ success: true, order }); 
        });

    } catch (error) {
        console.error("Finalize Error:", error);
        res.json({ success: false, message: error.message });
    }
};

const placeOrderStripe = async (req, res) => {
};

export const singleOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        
        // Find order and populate the userId field with specific profile data
        const order = await orderModel.findById(orderId)
            .populate('userId', 'name email totalRewardPoints referralCount referralCode')
            .lean();

        if (!order) {
            return res.json({ success: false, message: "Order not found in Registry" });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error("Single Order Fetch Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Don't forget to export it!

const updateInvoiceStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        await orderModel.findByIdAndUpdate(orderId, { allowInvoice: status });
        res.json({ success: true, message: "Invoice visibility updated" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};





export  const syncLegacyOrderDetails = async (req, res) => {
    try {
        // 1. Find orders that are "Legacy" (missing the new firstName field)
        const ordersToFix = await orderModel.find({
            $or: [
                { "address.firstName": { $exists: false } },
                { "address.firstName": "" }
            ]
        });

        let successCount = 0;
        let skipCount = 0;

        for (const order of ordersToFix) {
            // Handle both ObjectId and $oid string formats
            const userId = order.userId?.$oid || order.userId;
            
            // Try to find the user in the User table
            const user = await userModel.findById(userId);
            
            if (user || order.address.name) {
                // Determine the Name: User Table Name > address.name fallback > Email prefix
                const fullName = user?.name || order.address.name || user?.email?.split('@')[0] || "Collector";
                
                // Split the name for your new Schema (FirstName/LastName)
                const nameParts = fullName.trim().split(" ");
                const firstName = nameParts[0];
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Legacy";

                // Prepare the patched address object
                const patchedAddress = {
                    ...order.address, // Keep existing street, city, etc.
                    firstName: firstName,
                    lastName: lastName,
                    email: user?.email || order.address.email || "N/A"
                };

                // Remove the old 'name' key if it exists to keep the object clean
                delete patchedAddress.name;

                // Update existing record strictly
                await orderModel.findByIdAndUpdate(order._id, {
                    $set: { 
                        address: patchedAddress,
                        // Fix date format if it's currently a MongoDB object
                        date: typeof order.date === 'object' ? Number(order.date.$numberLong) : order.date
                    }
                });
                successCount++;
            } else {
                skipCount++;
            }
        }

        res.json({
            success: true,
            message: `Migration finished. Updated: ${successCount}, Skipped: ${skipCount}`
        });

    } catch (error) {
        console.error("Migration Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};







export { verifyRazorpay, updateInvoiceStatus,verifyStripe, placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, getAdminDashboardStats, getDetailedAnalytics, updateStock, cancelOrder };