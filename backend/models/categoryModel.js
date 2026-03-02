// models/categoryModel.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    group: { type: String, default: "Independent" },
    productCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    image: { type: String, default: "" } // NEW FIELD
});

categorySchema.index({ group: 1 });
categorySchema.index({ featured: 1 }); // Index for fast filtering

const categoryModel = mongoose.models.category || mongoose.model("category", categorySchema);
export default categoryModel;