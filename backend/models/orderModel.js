import mongoose from 'mongoose';
import counterModel from './counterModel.js';

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    orderNo: { type: Number, unique: true }, // The new sequential field
    items: { type: Array, required: true },
    trackingNumber: { type: String, default: '' },
    billingAddress: { type: Object }, // Store the billing address separately
    pointsUsed: { type: Number, default: 0 },
    couponUsed: { type: String, default: null },
    discountAmount: { type: Number, default: 0 },
    amount: { type: Number, required: true },

    deliveryFee: { type: Number, required: true, default: 0 },
    deliveryMethod: { 
        type: String, 
        required: true, 
        enum: ['standard', 'fast'], 
        default: 'standard' 
    }, //
    allowInvoice: { type: Boolean, default: false },

    address: { type: Object, required: true },
    status: { type: String, required: true, default:'Order Placed' },
    shippedDate: { type: Number, default: null },
    paymentMethod: { type: String, required: true },
    payment: { type: Boolean, required: true , default: false },
    date: {type: Number, required:true},
    currency: { type: String, required: true, default: 'INR' }
});

// --- AUTO-INCREMENT LOGIC ---
orderSchema.pre('save', async function (next) {
    if (!this.isNew) return next(); // Only generate for new orders

    try {
        const counter = await counterModel.findOneAndUpdate(
            { id: 'orderNumber' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        this.orderNo = counter.seq;
        next();
    } catch (error) {
        next(error);
    }
});

const orderModel = mongoose.models.order || mongoose.model('order', orderSchema);
export default orderModel;