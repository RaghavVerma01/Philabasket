import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    referralCode: { type: String, unique: true },
    // Password Recovery Fields
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // Rewards System
    totalRewardPoints: { type: Number, default: 0 },
    // Loophole & Cap Protection
    referralCount: { type: Number, default: 0 }, 
    signupIP: { type: String }, 
    tier: { 
        type: String, 
        enum: ['Silver', 'Gold', 'Platinum'], 
        default: 'Silver' 
    },
    referredBy: { type: String, default: null }, // Stores the inviter's referralCode
    isReferralRewardClaimed: { type: Boolean, default: false }, // Prevents multi-reward loops

    defaultAddress: {
        street: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        zipCode: { type: String, default: "" },
        phone: { type: String, default: "" }
    },
    // User Data
    wishlistData: { type: Array, default: [] },
    cartData: { type: Object, default: {} }
}, { minimize: false, timestamps: true }) // Added timestamps for better audit trails

userSchema.pre('save', function (next) {
    // 1. Generate Referral Code if missing
    if (!this.referralCode) {
        this.referralCode = "PHILA-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // 2. Update Tier based on points
    // Silver: 0 - 2,99,999
    // Gold: 3,00,000 - 4,99,999
    // Platinum: 5,00,000+
    const points = this.totalRewardPoints || 0;
    
    if (points >= 50000) {
        this.tier = 'Platinum';
    } else if (points >= 30000) {
        this.tier = 'Gold';
    } else {
        this.tier = 'Silver';
    }

    next();
});

userSchema.virtual('orders', {
    ref: 'order',
    localField: '_id',
    foreignField: 'userId'
});

userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;