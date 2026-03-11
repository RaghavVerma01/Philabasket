import rewardTransactionModel from "../models/rewardTranscationModel.js";
import userRewardModel from "../models/userRewardModel.js";
import userModel from "../models/userModel.js"; // Needed to link ID to Email

export const getUnifiedHistory = async (req, res) => {
    try {
        const userId = req.user?.userId || req.body.userId;

        if (!userId) {
            return res.json({ success: false, message: "Authentication Failed" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const email = user.email;

        const [transactions, coupons] = await Promise.all([
            rewardTransactionModel.find({ userEmail: email }).lean(),
            userRewardModel.find({ email: email }).lean()
        ]);

        // 1. Format Coupons (These are ALWAYS redemptions/subtractions)
        // 1. Format Coupons (Now checking if pointsUsed is actually positive or negative)
const formattedCoupons = coupons.map(c => {
    const rawAmount = c.pointsUsed || c.require_point || 0;
    
    // IF pointsUsed is positive, it's a GAIN (+). 
    // IF pointsUsed is negative, it's a LOSS (-).
    const isNegative = rawAmount < 0; 

    return {
        _id: c._id,
        type: 'VOUCHER',
        title: c.name || `Registry Adjustment`,
        description: c.description || `Adjustment Ref: ${c.discountCode}`,
        amount: Math.abs(rawAmount), 
        status: 'used', // Hardcoded as per your request
        createdAt: c.createdAt,
        isNegative: isNegative 
    };
});

        // 2. Format Transactions (Earnings or Adjustments)
        const formattedTransactions = transactions.map(t => {
            const rawAmount = t.rewardAmount || 0;
            
            // LOGIC: If action is earn, it's positive. If redeem, it's negative.
            // If it's an 'adjustment', we check if the number itself is less than 0.
            const isRedemption = t.actionType === 'redeem_point' || rawAmount < 0;

            return {
                _id: t._id,
                type: isRedemption ? 'REDEMPTION' : 'CASHBACK',
                title: isRedemption ? 'Registry Debit' : 'Registry Credit',
                description: t.description || (t.orderId ? `Order Ref: #${t.orderId.slice(-6)}` : 'Manual Adjustment'),
                amount: Math.abs(rawAmount),
                createdAt: t.createdAt,
                isNegative: isRedemption,
                status: t.status || 'completed'
            };
        });

        // 3. Merge and Sort
        const combinedHistory = [...formattedCoupons, ...formattedTransactions].sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.json({ success: true, history: combinedHistory });

    } catch (error) {
        console.error("Ledger Sync Error:", error);
        res.json({ success: false, message: "Archive connection failed." });
    }
};