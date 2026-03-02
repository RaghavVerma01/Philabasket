import couponModel from "../models/couponModel.js";

// --- FOR USERS: Validate during checkout ---
import orderModel from "../models/orderModel.js";


export const validateCoupon = async (req, res) => {
    try {
        // userId must be passed from the frontend applyCoupon call
        const { code, amount, userId } = req.body;

        const coupon = await couponModel.findOne({ 
            code: code.toUpperCase(), 
            isActive: true 
        });

        if (!coupon) {
            return res.json({ success: false, message: "Invalid or expired coupon code." });
        }

        // 1. Check Expiry
        if (new Date() > new Date(coupon.expiryDate)) {
            return res.json({ success: false, message: "This coupon has expired." });
        }

        // 2. Check Minimum Order Value
        if (amount < coupon.minAmount) {
            return res.json({ success: false, message: `Minimum amount for this coupon is ₹${coupon.minAmount}` });
        }

        // 3. NEW: Check if the user has already used this coupon
        // We look for any completed or placed order by this user with this coupon code
        if (userId) {
            const alreadyUsed = await orderModel.findOne({ 
                userId: userId, 
                couponUsed: code.toUpperCase() 
            });

            if (alreadyUsed) {
                return res.json({ 
                    success: false, 
                    message: "Protocol Denied: This coupon has already been availed by your account." 
                });
            }
        }

        res.json({ success: true, coupon });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// --- FOR ADMIN: Create new coupon ---
export const createCoupon = async (req, res) => {
    try {
        const { code, discountType, value, minAmount, expiryDate } = req.body;

        const exists = await couponModel.findOne({ code: code.toUpperCase() });
        if (exists) return res.json({ success: false, message: "Coupon code already exists" });

        const newCoupon = new couponModel({
            code: code.toUpperCase(),
            discountType,
            value,
            minAmount,
            expiryDate,
            isActive: true
        });

        await newCoupon.save();
        res.json({ success: true, message: "Coupon deployed to registry" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// --- FOR ADMIN: List all coupons ---
export const listCoupons = async (req, res) => {
    try {
        const coupons = await couponModel.find({}).sort({ expiryDate: -1 });
        res.json({ success: true, coupons });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};