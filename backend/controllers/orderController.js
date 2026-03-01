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

const getOrderHtmlTemplate = (orderData, trackingNumber = null) => {
    const { address, items, amount, currency, paymentMethod, orderNo, status, date } = orderData;
    const symbol = currency === 'USD' ? '$' : '₹';
    const accentColor = "#BC002D"; // PhilaBasket Brand Red
    const secondaryColor = "#1a1a1a";
    const bgColor = "#FCF9F4";

    const itemRows = items.map(item => `
        <tr style="border-bottom: 1px solid #eeeeee;">
            <td style="padding: 12px 0;">
                <p style="margin: 0; font-weight: bold; color: ${secondaryColor}; font-size: 14px;">${item.name}</p>
                <p style="margin: 4px 0 0 0; color: #888; font-size: 11px; text-transform: uppercase;">Specimen ID: ${item._id.toString().slice(-6)}</p>
            </td>
            <td style="padding: 12px 0; text-align: center; color: ${secondaryColor}; font-weight: bold;">x${item.quantity}</td>
            <td style="padding: 12px 0; text-align: right; color: ${accentColor}; font-weight: bold;">${symbol}${item.price.toLocaleString()}</td>
        </tr>`).join('');

    // Dynamic Payment Protocol Section
    let paymentInstructions = '';
    if (paymentMethod === 'Direct bank transfer' || paymentMethod === 'Bank Transfer') {
        paymentInstructions = `
            <div style="margin-top: 25px; padding: 20px; background-color: #fff; border: 1px dashed ${accentColor}; border-radius: 4px;">
                <h4 style="margin: 0 0 10px 0; color: ${accentColor}; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Bank Ledger Protocol</h4>
                <p style="margin: 5px 0; font-size: 13px;"><strong>A/C Name:</strong> PhilaBasket.com</p>
                <p style="margin: 5px 0; font-size: 13px;"><strong>Bank:</strong> ICICI Bank</p>
                <p style="margin: 5px 0; font-size: 13px;"><strong>A/C Number:</strong> 072105001250</p>
                <p style="margin: 5px 0; font-size: 13px;"><strong>IFSC:</strong> ICIC0000721</p>
                <p style="margin: 15px 0 0 0; font-size: 11px; color: #666; font-style: italic;">*Please use Order #${orderNo} as payment reference.</p>
            </div>`;
    } else if (paymentMethod === 'Cheque') {
        paymentInstructions = `
            <div style="margin-top: 25px; padding: 20px; background-color: #fff; border: 1px dashed ${accentColor}; border-radius: 4px;">
                <h4 style="margin: 0 0 10px 0; color: ${accentColor}; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Physical Cheque Protocol</h4>
                <p style="margin: 5px 0; font-size: 13px;"><strong>Payable to:</strong> PhilaBasket.com</p>
                <p style="margin: 5px 0; font-size: 11px; color: #444; line-height: 1.6;">
                    <strong>Mailing Address:</strong><br>
                    C/O Bhavyansh Prakhar Rastogi<br>
                    S – 606/607 School Block – 2, Park End Apartment,<br>
                    ShakarPur - 110092, Delhi, India
                </p>
            </div>`;
    }

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
                                        ? `Your philatelic acquisition has been dispatched from the registry. You can track your specimen using ID: <strong>${trackingNumber}</strong>.` 
                                        : `We have successfully received your acquisition request. Your specimens are currently being authenticated and prepared for transit.`}
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

                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 10px;">
                                    <tr>
                                        <td width="70%" style="padding: 5px 0; font-size: 14px; color: #777;">Registry Shipping Fee</td>
                                        <td align="right" style="padding: 5px 0; font-size: 14px; font-weight: bold;">${symbol}100.00</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; font-size: 16px; font-weight: 900; text-transform: uppercase; border-top: 2px solid ${secondaryColor};">Final Valuation</td>
                                        <td align="right" style="padding: 10px 0; font-size: 18px; font-weight: 900; color: ${accentColor}; border-top: 2px solid ${secondaryColor};">${symbol}${amount.toLocaleString()}</td>
                                    </tr>
                                </table>

                                ${paymentInstructions}

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
                                            <h4 style="margin: 0 0 10px 0; font-size: 11px; color: #999; text-transform: uppercase;">Payment Method</h4>
                                            <p style="margin: 0; font-size: 12px; line-height: 1.5;">${paymentMethod}</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding: 30px; background-color: #f9f9f9; text-align: center; border-top: 1px solid #eee;">
                                <p style="margin: 0; font-size: 11px; color: #999; line-height: 1.6;">
                                    This is a certified acquisition record from the PhilaBasket Registry.<br>
                                    For inquiries, contact: <strong>admin@philabasket.com</strong>
                                </p>
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







// backend/controllers/orderController.js

const placeOrder = async (req, res) => {
    try {
        const { 
            userId, items, amount, address, billingAddress, 
            currency, pointsUsed, couponUsed, discountAmount, 
            paymentMethod, status 
        } = req.body;

        // 1. BLOCK DOUBLE COUPON USAGE
        if (couponUsed) {
            const alreadyUsed = await userRewardModel.findOne({ 
                discountCode: couponUsed, 
                email: address.email, 
                status: 'used' 
            });

            if (alreadyUsed) {
                return res.json({ 
                    success: false, 
                    message: `Security Alert: Coupon ${couponUsed} has already been recorded in your Archive.` 
                });
            }
        }

        // 2. CONSTRUCT ORDER DATA
        const orderData = {
            userId,
            items,
            address,
            billingAddress: billingAddress || address,
            amount,
            pointsUsed: pointsUsed || 0,
            couponUsed: couponUsed || null,
            discountAmount: discountAmount || 0,
            currency: currency || 'INR',
            paymentMethod: paymentMethod || "COD", 
            payment: false,
            date: Date.now(),
            status: status || (paymentMethod === 'Cheque' ? 'Cheque on Hold' : 'Order Placed')
        };

        // 3. SAVE ORDER TO DATABASE
        const newOrder = new orderModel(orderData);
        await newOrder.save(); 

        // 4. RECORD USAGE IN USER REWARD TABLE
        if (couponUsed) {
            const usedEntry = new userRewardModel({
                email: address.email,
                rewardName: "Coupon Redeemed",
                description: `Acquisition Discount via ${couponUsed}`,
                discountValue: discountAmount,
                discountCode: couponUsed,
                pointsUsed: discountAmount,
                status: 'used',
                createdAt: new Date()
            });
            await usedEntry.save();
        }

        // 5. DEDUCT REWARD POINTS
        if (pointsUsed > 0) {
            await recordRewardActivity(userId, address.email, -Math.abs(pointsUsed), 'redeem_point', newOrder._id);
        }

        // 6. UPDATE INVENTORY
        for (const item of items) {
            await productModel.findByIdAndUpdate(item._id, { $inc: { stock: -item.quantity } });
        }

        // 7. CLEAN USER CART
        await userModel.findByIdAndUpdate(userId, { $set: { cartData: {} } });

        // --- 8. TRIGGER EMAIL NOTIFICATION (THE FIX) ---
        try {
            const emailSubject = orderData.paymentMethod === 'Cheque' 
                ? "Order Received - Awaiting Cheque" 
                : "Order Confirmation";
            
                const htmlContent = getOrderHtmlTemplate(newOrder);

            await sendEmail(address.email, emailSubject, htmlContent);
            console.log("Acquisition Email Sent to:", address.email);
        } catch (emailError) {
            console.error("Email notification failed to send:", emailError);
        }

        // 9. TRIGGER WHATSAPP ALERT FOR ADMIN
        await sendWhatsAppAlert(orderData);

        // 10. FINAL SUCCESS RESPONSE
        res.json({ 
            success: true, 
            message: paymentMethod === 'Cheque' 
                ? "Acquisition secured. Order is 'On Hold' awaiting cheque clearance." 
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


const updateStatus = async (req, res) => {
    try {
        const { orderId, status, trackingNumber } = req.body;
        
        const currentOrder = await orderModel.findById(orderId);
        if (!currentOrder) {
            return res.json({ success: false, message: "Order not found" });
        }

        // Logic for auto-shipping if tracking number is added
        let finalStatus = (trackingNumber && (status === 'Order Placed' || status === 'Packing')) ? 'Shipped' : status;
        
        const updateFields = { status: finalStatus };
        if (trackingNumber) updateFields.trackingNumber = trackingNumber;

        // --- REWARD LOGIC: TRIGGER ONLY ONCE ---
        if (finalStatus === 'Delivered' && currentOrder.status !== 'Delivered') {
            updateFields.payment = true;

            const earnedPoints = Math.floor(currentOrder.amount * 0.10);

            // Record points and create ledger entry
            await recordRewardActivity(
                currentOrder.userId, 
                currentOrder.address.email, 
                earnedPoints, 
                'earn_point', 
                currentOrder._id
            );

            await updateSoldCount(currentOrder.items);
            console.log(`Registry Ledger Updated: ${earnedPoints} points awarded.`);

            try {
                await sendEmail(
                    currentOrder.address.email, 
                    "Acquisition Delivered - Registry Updated", 
                    getOrderHtmlTemplate(currentOrder) 
                );
            } catch (emailError) {
                console.error("Delivery Email Failed:", emailError);
            }
        }

        // --- THE FIX: REMOVED THE 'RETURN' BLOCK ---
        // Instead of returning an error if already delivered, we simply 
        // skip the reward logic above and proceed to save the status.
        
        await orderModel.findByIdAndUpdate(orderId, updateFields);
        
        // Handle Email logic for shipping...
        if (finalStatus === 'Shipped' && trackingNumber) {
            await sendEmail(
                currentOrder.address.email, 
                "Items Shipped", 
                getOrderHtmlTemplate(currentOrder, trackingNumber) 
            );
        }

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
        const orders = await orderModel.find({}).populate('userId', 'name email totalRewardPoints referralCount referralCode').lean(); 
        res.json({ success: true, orders });
    } catch (error) { res.json({ success: false, message: error.message }); }
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







export { verifyRazorpay, verifyStripe, placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, getAdminDashboardStats, getDetailedAnalytics, updateStock, cancelOrder };