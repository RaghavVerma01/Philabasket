import mongoose from "mongoose";


const feedbackSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    orderId: { type: String, required: true, unique: true },
    orderNo: { type: String, required: true },
    text: { type: String },
    image: { type: String }, // Cloudinary URL
    rating: { type: Number, default: 5 },
    isFeatured: { type: Boolean, default: false }, // For Admin Testimonials
    date: { type: Number, required: true }
});


const feedbackModel = mongoose.models.feedback || mongoose.model("feedback", feedbackSchema);
export default feedbackModel;