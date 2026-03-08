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
const razorpayInstance = (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) 
    ? new razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }) 
    : null;

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
    // Destructure orderData
    const { 
        address, 
        items, 
        amount, 
        currency, 
        paymentMethod, 
        orderNo, 
        date, 
        pointsUsed, 
        couponUsed, 
        discountAmount,
        deliveryFee 
    } = orderData;

    const symbol = currency === 'USD' ? '$' : '₹';
    const accentColor = "#BC002D"; 
    const secondaryColor = "#1a1a1a";
    const bgColor = "#FCF9F4";

    // --- LOGIC CALCULATIONS ---
    const rawSubtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const gstAmount = rawSubtotal * 0.05;
    const pbExclusiveDiscount = rawSubtotal * 0.05;
    const pointsValue = pointsUsed ? pointsUsed / 10 : 0; 

    // --- PROTOCOL FEE RESOLUTION ---
    // Priority: 1. Explicitly passed activeFee | 2. Stored deliveryFee | 3. Hard fallback
    const finalFee = activeFee !== null ? activeFee : (deliveryFee || 0);
    const displayShipping = Number(finalFee).toFixed(2);
// --- SHIPPING FEE DISPLAY LOGIC ---
const isFreeShipping = currency === 'INR' && amount >= 4999;
const shippingDisplayValue = isFreeShipping 
    ? `<span style="color: #2e7d32; font-weight: 900;">COMPLIMENTARY</span>` 
    : `${symbol}${displayShipping}`;

// ... inside the return template table ...


    const itemRows = items.map(item => `
        <tr style="border-bottom: 1px solid #eeeeee;">
            <td style="padding: 12px 0;">
                <p style="margin: 0; font-weight: bold; color: ${secondaryColor}; font-size: 14px;">${item.name}</p>
                <p style="margin: 4px 0 0 0; color: #888; font-size: 11px; text-transform: uppercase;">Specimen ID: ${item._id.toString().slice(-6)}</p>
            </td>
            <td style="padding: 12px 0; text-align: center; color: ${secondaryColor}; font-weight: bold;">x${item.quantity}</td>
            <td style="padding: 12px 0; text-align: right; color: ${accentColor}; font-weight: bold;">${symbol}${item.price.toFixed(2)}</td>
        </tr>`).join('');

    return `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: ${secondaryColor};">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${bgColor}; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                        <tr>
                            <td style="background-color: ${accentColor}; padding: 40px 20px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 3px; font-weight: 900;">PhilaBasket</h1>
                                <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">The World of Philately</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="margin: 0 0 15px 0; font-size: 20px;">Order ${trackingNumber ? 'Dispatched' : 'Confirmed'}</h2>
                                <p style="font-size: 15px; color: #555; line-height: 1.6;">Hi ${address.firstName},</p>
                                <p style="font-size: 15px; color: #555; line-height: 1.6;">
                                    ${trackingNumber 
                                        ? `Your philatelic acquisition has been dispatched. Track ID: <strong>${trackingNumber}</strong>.` 
                                        : `Your acquisition request has been received. Our curators are currently authenticating your specimens.`}
                                </p>

                                <table width="100%" style="margin: 25px 0; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 15px 0;">
                                    <tr>
                                        <td><span style="font-size: 11px; color: #999; text-transform: uppercase;">Registry ID</span><br><strong>#${orderNo}</strong></td>
                                        <td align="right"><span style="font-size: 11px; color: #999; text-transform: uppercase;">Acquisition Date</span><br><strong>${new Date(date).toLocaleDateString()}</strong></td>
                                    </tr>
                                </table>

                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                                    <thead>
                                        <tr style="text-align: left; font-size: 11px; color: #999; text-transform: uppercase;">
                                            <th style="padding-bottom: 10px;">Specimen</th>
                                            <th style="padding-bottom: 10px; text-align: center;">Qty</th>
                                            <th style="padding-bottom: 10px; text-align: right;">Valuation</th>
                                        </tr>
                                    </thead>
                                    <tbody>${itemRows}</tbody>
                                </table>

                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 10px; border-top: 1px solid #f0f0f0; padding-top: 10px;">
                                    <tr>
                                        <td width="70%" style="padding: 4px 0; font-size: 13px; color: #777;">Asset Subtotal</td>
                                        <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: bold;">${symbol}${rawSubtotal.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 4px 0; font-size: 13px; color: #777;">GST Protocol (5%)</td>
                                        <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: bold;">${symbol}${gstAmount.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 4px 0; font-size: 13px; color: #2e7d32; font-weight: bold;">Exclusive PB Discount (5%)</td>
                                        <td align="right" style="padding: 4px 0; font-size: 13px; color: #2e7d32; font-weight: bold;">- ${symbol}${pbExclusiveDiscount.toFixed(2)}</td>
                                    </tr>
                                    
                                    ${discountAmount > 0 ? `
                                    <tr>
                                        <td style="padding: 4px 0; font-size: 13px; color: #2e7d32; font-weight: bold;">Coupon Applied (${couponUsed})</td>
                                        <td align="right" style="padding: 4px 0; font-size: 13px; color: #2e7d32; font-weight: bold;">- ${symbol}${discountAmount.toFixed(2)}</td>
                                    </tr>` : ''}

                                    ${pointsUsed > 0 ? `
                                    <tr>
                                        <td style="padding: 4px 0; font-size: 13px; color: ${accentColor}; font-weight: bold;">Archive Credit Redemption (${pointsUsed} PTS)</td>
                                        <td align="right" style="padding: 4px 0; font-size: 13px; color: ${accentColor}; font-weight: bold;">- ${symbol}${pointsValue.toFixed(2)}</td>
                                    </tr>` : ''}

                                    <tr>
    <td style="padding: 4px 0; font-size: 13px; color: #777;">Registry Shipping Fee (${address.country})</td>
    <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: bold;">
        ${shippingDisplayValue}
    </td>
</tr>
                                    <tr>
                                        <td style="padding: 15px 0 5px 0; font-size: 16px; font-weight: 900; text-transform: uppercase; border-top: 2px solid ${secondaryColor};">Final Asset Valuation</td>
                                        <td align="right" style="padding: 15px 0 5px 0; font-size: 18px; font-weight: 900; color: ${accentColor}; border-top: 2px solid ${secondaryColor};">${symbol}${amount.toLocaleString()}</td>
                                    </tr>
                                </table>
                                <table width="100%" style="margin-top: 30px;">
                                    <tr>
                                        <td width="50%" valign="top">
                                            <h4 style="margin: 0 0 10px 0; font-size: 11px; color: #999; text-transform: uppercase;">Shipping Registry</h4>
                                            <p style="margin: 0; font-size: 12px; line-height: 1.5;">
                                                ${address.firstName} ${address.lastName}<br>
                                                ${address.street}<br>
                                                ${address.city}, ${address.state} ${address.zipcode}
                                            </p>
                                        </td>
                                        <td width="50%" valign="top">
                                            <h4 style="margin: 0 0 10px 0; font-size: 11px; color: #999; text-transform: uppercase;">Payment Protocol</h4>
                                            <p style="margin: 0; font-size: 12px; line-height: 1.5;">${paymentMethod}</p>
                                        </td>
                                    </tr>
                                </table>
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
        const order = await orderModel.findById(orderId).populate('userId');

        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }

        // Generate the Philately-themed HTML
        const emailHtml = getOrderHtmlTemplate(order, order.deliveryFee, order.trackingNumber);

        // Send the email using your transporter utility
        const result = await sendEmail(
            order.address.email || order.userId.email,
            `Acquisition Registry: Order #${order.orderNo}`,
            emailHtml
        );

        if (result.success) {
            res.json({ success: true, message: "Invoice dispatched to collector" });
        } else {
            res.json({ success: false, message: "Logistics email delivery failed" });
        }
    } catch (error) {
        console.error(error);
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
        const { orderId, status, trackingNumber ,shippedDate } = req.body;
        
        // Populate userId to get the user's current Tier
        const currentOrder = await orderModel.findById(orderId).populate('userId');
        if (!currentOrder) {
            return res.json({ success: false, message: "Order not found" });
        }

        let finalStatus = (trackingNumber && (status === 'Order Placed' || status === 'Packing')) ? 'Shipped' : status;
        const updateFields = { status: finalStatus };
        if (trackingNumber) updateFields.trackingNumber = trackingNumber;
        if (shippedDate) updateFields.shippedDate = shippedDate;

        // --- UPDATED REWARD LOGIC: TIER BASED MULTIPLIER ---
        if (finalStatus === 'Delivered' && currentOrder.status !== 'Delivered') {
            updateFields.payment = true;
        
            // 1. Calculate Item-Only Subtotal (Excluding delivery, discounts, and GST)
            const itemSubtotal = currentOrder.items.reduce((acc, item) => {
                return acc + (item.price * item.quantity);
            }, 0);
        
            // 2. Define Multipliers based on User Tier
            const userTier = currentOrder.userId?.tier || 'Silver';
            let multiplier = 0.10; // Silver: 10%
            if (userTier === 'Gold') multiplier = 0.30;      // Gold: 30%
            if (userTier === 'Platinum') multiplier = 0.50;  // Platinum: 50%
        
            // 3. Calculate points based on Item Subtotal only
            const earnedPoints = Math.floor(itemSubtotal * multiplier);
        
            await recordRewardActivity(
                currentOrder.userId._id, 
                currentOrder.address.email, 
                earnedPoints, 
                'earn_point', 
                currentOrder._id
            );
        
            // Logging for the Archive
            console.log(`Registry Ledger: ${userTier} Rewards calculated on Item Value (₹${itemSubtotal}). Points: ${earnedPoints}`);

            try {
                await sendEmail(
                    currentOrder.address.email, 
                    `Acquisition Delivered - ${userTier} Rewards Added`, 
                    getOrderHtmlTemplate(currentOrder) 
                );
            } catch (emailError) {
                console.error("Delivery Email Failed:", emailError);
            }
        }

        await orderModel.findByIdAndUpdate(orderId, updateFields);
        
        if (finalStatus === 'Shipped' && trackingNumber) {
            await sendEmail(
                currentOrder.address.email, 
                "Items Shipped", 
                getOrderHtmlTemplate(currentOrder, null, trackingNumber) 
            );
        }

        if (shippedDate) updateFields.shippedDate = shippedDate;

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
        const { page = 1, limit = 10, status, sort } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // 1. Build Dynamic Filter Query
        let query = {};
        if (status && status !== "ALL") {
            query.status = status;
        }

        if (req.query.date) {
            const start = new Date(req.query.date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(req.query.date);
            end.setHours(23, 59, 59, 999);
            
            query.date = { $gte: start.getTime(), $lte: end.getTime() };
        }

        // 2. Build Sort Logic
        let sortOrder = { date: -1 }; // Default: Newest first
        if (sort === 'DATE_ASC') sortOrder = { date: 1 };
        if (sort === 'AMOUNT')   sortOrder = { amount: -1 };

        // 3. Parallel Execution for Speed
        const [orders, totalOrdersCount, statsData] = await Promise.all([
            orderModel.find(query)
                .populate('userId', 'name email orderNo totalRewardPoints referralCount referralCode')
                .sort(sortOrder)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            orderModel.countDocuments(query), // Count reflects current filter
            orderModel.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                        revenue: { $sum: { $cond: [{ $ne: ["$status", "Cancelled"] }, "$amount", 0] } }
                    }
                }
            ])
        ]);

        // Format stats for the frontend dashboard
        const stats = {
            total: await orderModel.countDocuments({}), // Absolute total for badge
            revenue: statsData.reduce((acc, curr) => acc + curr.revenue, 0),
            ...statsData.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {})
        };

        res.json({ 
            success: true, 
            orders, 
            totalOrders: totalOrdersCount, 
            stats,
            totalPages: Math.ceil(totalOrdersCount / parseInt(limit)) 
        });
    } catch (error) { 
        console.error("Order List Error:", error);
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
};

const placeOrderRazorpay = async (req, res) => {
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