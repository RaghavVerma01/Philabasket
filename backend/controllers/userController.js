import 'dotenv/config'
import validator from "validator";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js";
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import orderModel from "../models/orderModel.js";
// backend/controllers/userController.js
import userRewardModel from "../models/userRewardModel.js";
import rewardTransactionModel from '../models/rewardTranscationModel.js';



const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

// --- HELPER: DUAL-REWARD & LOOPHOLE PROTECTION ---
// --- HELPER: DUAL-REWARD WITH 3-PERSON CAP ---
// --- HELPER: DUAL-REWARD WITH 3-PERSON CAP & IP PROTECTION ---
// const rewardReferrer = async (referrerCode, newUser, ipAddress) => {
//     try {
//         if (!referrerCode || !newUser) return false;

//         // 1. Find the inviter
//         const referrer = await userModel.findOne({ referralCode: referrerCode });
//         if (!referrer) return false;

//         // 2. Self-Referral Protection
//         if (referrer._id.toString() === newUser._id.toString()) return false;

//         // 3. CAP PROTECTION: Limit to 3 referrals
//         if (referrer.referralCount >= 3) return false;

//         // 4. IP Protection: Prevent same person creating multiple accounts
//         const duplicateIP = await userModel.findOne({ 
//             signupIP: ipAddress, 
//             _id: { $ne: newUser._id } 
//         });
//         if (duplicateIP) return false;

//         // 5. Apply Rewards
//         referrer.totalRewardPoints = (referrer.totalRewardPoints || 0) + 50;
//         referrer.referralCount = (referrer.referralCount || 0) + 1;
        
//         newUser.totalRewardPoints = (newUser.totalRewardPoints || 0) + 25;
//         newUser.signupIP = ipAddress;

//         await referrer.save();
//         await newUser.save();
//         return true;
//     } catch (error) {
//         console.error("Referral Error:", error);
//         return false;
//     }
// }
export const rewardReferrer = async (order) => {
    try {
        // 1. Identify the buyer
        const newUser = await userModel.findById(order.userId);
        
        // 2. Protocol Check: Must have a referrer and must NOT have been rewarded yet
        if (!newUser || !newUser.referredBy || newUser.isReferralRewardClaimed) return false;

        // 3. Identify the Referrer (The Inviter)
        const referrer = await userModel.findOne({ referralCode: newUser.referredBy });
        if (!referrer) return false;

        // 4. IP Protection: Verify unique household to prevent "self-referral" farming
        if (newUser.signupIP === referrer.signupIP) return false;

        // 5. Apply Rewards
        // Inviter gets 50 PTS
        referrer.totalRewardPoints = (referrer.totalRewardPoints || 0) + 1000;
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        
        // New Buyer gets 25 PTS
        newUser.totalRewardPoints = (newUser.totalRewardPoints || 0) + 500;
        newUser.isReferralRewardClaimed = true; // Lock the reward so it only happens once

        await referrer.save();
        await newUser.save();
        
        return true;
    } catch (error) {
        console.error("Referral Reward Error:", error);
        return false;
    }
}

// --- UPDATED GOOGLE LOGIN ---
const googleLogin = async (req, res) => {
    try {
        const { idToken, referrerCode } = req.body;
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const { name, email, picture } = ticket.getPayload();
        let user = await userModel.findOne({ email });

        if (!user) {
            user = await userModel.create({
                name, email, image: picture,
                password: Date.now() + Math.random().toString(),
                totalRewardPoints: 0, referralCount: 0
            });

            if (referrerCode) {
                await rewardReferrer(referrerCode, user, req.ip || req.headers['x-forwarded-for']);
            }
        }
        const token = createToken(user._id);
        res.json({ success: true, token });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// --- UPDATED REGISTRATION ---
const registerUser = async (req, res) => {
    try {
        const { name, email, password, referrerCode } = req.body;
        if (await userModel.findOne({ email })) {
            return res.json({ success: false, message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name, email, password: hashedPassword,
            totalRewardPoints: 1000, referralCount: 0,referredBy: req.body.referrerCode || null, 
            signupIP: req.ip
        });

        const user = await newUser.save();

        if (referrerCode) {
            await rewardReferrer(referrerCode, user, req.ip || req.headers['x-forwarded-for']);
        }

        const token = createToken(user._id);
        res.json({ success: true, token });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// --- PASSWORD RECOVERY ---
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "Registry email not found." });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 Hour

        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const frontendUrl = process.env.FRONTEND_URL;

        if (!frontendUrl) {
            console.error("DEPLOYMENT ERROR: FRONTEND_URL is not set in the production dashboard.");
            return res.json({ success: false, message: "Registry protocol error. Contact Support." });
        }

        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        const mailOptions = {
            to: user.email,
            from: 'PhilaBasket Registry <noreply@philabasket.com>',
            subject: 'Archive Access Recovery Protocol',
            text: `A recovery protocol was initiated for your account.\n\nPlease click here to reset your credentials:\n${resetUrl}`
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Recovery link dispatched." });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await userModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.json({ success: false, message: "Token is invalid or expired." });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();
        res.json({ success: true, message: "Credentials updated successfully." });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// --- STANDARD LOGIN ---
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User doesn't exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = createToken(user._id)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: 'Invalid credentials' })
        }
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// --- ADMIN & PROFILE ---
const adminLogin = async (req, res) => {
    try {
        const {email,password} = req.body
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email+password,process.env.JWT_SECRET);
            res.json({success:true,token})
        } else {
            res.json({success:false,message:"Invalid credentials"})
        }
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

 // Function to update user default address
const updateAddress = async (req, res) => {
    try {
        const { userId, address ,name} = req.body;

        // Find the user and update the defaultAddress field
        const updatedUser = await userModel.findByIdAndUpdate(
            userId, 
            { 
                defaultAddress: address,
                name: name // Sync name change
            },
            { new: true } // returns the updated document
        );

        if (!updatedUser) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({ 
            success: true, 
            message: "Address updated in the registry.",
            address: updatedUser.defaultAddress 
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// controllers/userController.js
export const getTopPhilatelists = async (req, res) => {
    try {
        const results = await orderModel.aggregate([
            { $match: { payment: true } },
            {
                $group: {
                    _id: "$userId",
                    totalSpent: { $sum: "$amount" },
                    orderCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            {
                $facet: {
                    byRevenue: [{ $sort: { totalSpent: -1 } }, { $limit: 100 }],
                    byFrequency: [{ $sort: { orderCount: -1 } }, { $limit: 100 }]
                }
            }
        ]);

        res.json({ 
            success: true, 
            topUsers: results[0].byRevenue, 
            mostFrequent: results[0].byFrequency 
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};


export const getPhilatelistDetail = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await userModel.findById(userId).populate('orders');

        if (!user) return res.json({ success: false, message: "User not found" });

        // Calculate total spent from the populated orders
        const totalSpent = user.orders
            .filter(order => order.payment === true)
            .reduce((acc, order) => acc + (order.amount || 0), 0);

        res.json({ 
            success: true, 
            user: { 
                ...user._doc, 
                orders: user.orders, 
                totalSpent // Now the frontend will see this!
            } 
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
// Remember to add updateAddress to your exports at the bottom of the file

const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.body; 
        const user = await userModel.findById(userId).select("-password");
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}
// Function to get all registered users
const listUsers = async (req, res) => {
    try {
        // We select email specifically. 
        // Ensure your userModel actually uses the field name 'email'
        const users = await userModel.find({}).select('name email');
        
        console.log(`Found ${users.length} registrants`); // Check your server terminal
        res.json({ success: true, users });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// controllers/userController.js

export const getAllUsersData = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const skip = (page - 1) * limit;

        // Build search query
        const query = search ? {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const totalUsers = await userModel.countDocuments(query);
        const users = await userModel.find(query)
            .select('-password') 
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({ 
            success: true, 
            users, 
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// NEW: Separate API for User Details (Call this only when clicking a user)
export const getSingleUserDetail = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await userModel.findById(userId).populate('orders');
        res.json({ success: true, user });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Adjust Archive Credits (Reward Points)


export const adjustRewardPoints = async (req, res) => {
    try {
        const { userId, amount, action ,description } = req.body;
        const numAmount = Number(amount);

        // 1. Fetch user to get current points and email
        const user = await userModel.findById(userId);
        if (!user) return res.json({ success: false, message: "Collector not found" });

        let finalPoints = user.totalRewardPoints;
        let pointsChange = 0;

        // 2. Calculate point difference based on action
        if (action === 'add') {
            finalPoints += numAmount;
            pointsChange = +numAmount;
        } else if (action === 'subtract') {
            finalPoints = Math.max(0, finalPoints - numAmount);
            pointsChange = -numAmount;
        } else if (action === 'overwrite') {
            pointsChange = numAmount - finalPoints;
            finalPoints = numAmount;
        }

        // 3. Update User Table
        user.totalRewardPoints = finalPoints;
        await user.save();

        // 4. Create Transaction Record in UserReward (Audit Log)
        const transaction = new userRewardModel({
            email: user.email,
            name: `Registry Adjustment (${action.toUpperCase()})`,
            description: description || "Manual adjustment by Archive Administrator.",
            discountValue: 0, // No monetary coupon created
            discountCode: `ADJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            pointsUsed: pointsChange, // Stored as positive for deductions, negative for additions in your schema
            status: 'used', // Marked as used so it doesn't appear as an active coupon
            createdAt: new Date()
        });

        await transaction.save();

        res.json({ 
            success: true, 
            message: `Registry updated. Balance: ${finalPoints} PTS`,
            newBalance: finalPoints
        });

    } catch (error) {
        console.error("Adjustment Error:", error);
        res.json({ success: false, message: error.message });
    }
};


export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const users = await userModel.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        }).limit(5);
        res.json({ success: true, users });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};


// controllers/userController.js


/**
 * Fetches the complete transactional history of reward points for a specific user.
 * Used by Admin to audit point adjustments.
 */
// controllers/userController.js

export const getUnifiedHistoryAdmin = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.json({ success: false, message: "Collector email required" });
        }

        const [transactions, coupons] = await Promise.all([
            rewardTransactionModel.find({ userEmail: email }).lean(),
            userRewardModel.find({ email: email }).lean()
        ]);

        // 1. Format Coupons
        const formattedCoupons = coupons.map(c => {
            const rawAmount = c.pointsUsed || c.require_point || 0;
            return {
                _id: c._id,
                type: 'VOUCHER',
                title: c.name || `Registry Adjustment`,
                description: c.description || `Adjustment Ref: ${c.discountCode}`,
                amount: Math.abs(rawAmount), 
                status: 'used',
                createdAt: c.createdAt,
                isNegative: rawAmount < 0 
            };
        });

        // 2. Format Transactions + Fetch actual orderNo from orderModel
        const formattedTransactions = await Promise.all(transactions.map(async (t) => {
            const rawAmount = t.rewardAmount || 0;
            const isRedemption = t.actionType === 'redeem_point' || rawAmount < 0;
            
            let actualOrderNo = null;

            // Fetch the sequential orderNo from the Order table if orderId exists
            if (t.orderId) {
                // We find by the ID stored in transaction to get the sequential orderNo
                const orderData = await orderModel.findById(t.orderId).select('orderNo').lean();
                actualOrderNo = orderData ? orderData.orderNo : null;
            }

            return {
                _id: t._id,
                type: isRedemption ? 'ORDER_REDEEM' : 'ORDER_EARN',
                title: isRedemption ? 'Registry Debit' : 'Registry Credit',
                description: t.description || 'Acquisition Reward Transaction',
                amount: Math.abs(rawAmount),
                createdAt: t.createdAt,
                isNegative: isRedemption,
                status: t.status || 'complete',
                // This is now the sequential number (1, 2, 3...) from your Order Schema
                orderNo: actualOrderNo, 
                orderId: t.orderId // Keep for link purposes
            };
        }));

        const combinedHistory = [...formattedCoupons, ...formattedTransactions].sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.json({ success: true, history: combinedHistory });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: "Archive connection failed." });
    }
};



export { 
    googleLogin, 
    loginUser, 
    registerUser, 
    adminLogin, 
    getUserProfile, 
    forgotPassword, 
    resetPassword ,
    listUsers,updateAddress
}