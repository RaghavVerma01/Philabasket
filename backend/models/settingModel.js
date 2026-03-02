import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    rate: { type: Number, default: 83 },
    indiaFee: { type: Number, default: 125 },
    globalFee: { type: Number, default: 750 },
}, { minimize: false });

const settingsModel = mongoose.models.settings || mongoose.model("settings", settingsSchema);
export default settingsModel;