import mongoose from "mongoose";
const settingsSchema = new mongoose.Schema({
    rate: { type: Number, default: 83 },
    // Standard Fees
    indiaFee: { type: Number, default: 125 },
    globalFee: { type: Number, default: 750 },
    // Fast Delivery Fees
    indiaFeeFast: { type: Number, default: 250 },
    globalFeeFast: { type: Number, default: 1500 },
    // Admin Toggles (On/Off)
    isIndiaFastActive: { type: Boolean, default: true },
    isGlobalFastActive: { type: Boolean, default: true }
}, { minimize: false });

const settingsModel = mongoose.models.settings || mongoose.model("settings", settingsSchema);
export default settingsModel;