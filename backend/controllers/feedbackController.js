import feedbackModel from "../models/feedbackModel.js";
import userModel from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

// Add Feedback
// File: controllers/feedbackController.js

// Inside feedbackController.js -> addFeedback function
// controllers/feedbackController.js
// controllers/feedbackController.js

import streamifier from 'streamifier';

const addFeedback = async (req, res) => {
    try {
        const { orderId, orderNo, text, rating, userId } = req.body;

        // 1. One-Feedback-Per-Order Validation
        const existingFeedback = await feedbackModel.findOne({ orderId });
        if (existingFeedback) {
            return res.json({ success: false, message: "Feedback already exists for this order." });
        }

        // 2. Stream Upload Logic for Memory Storage
        let imageUrl = "";
        
        const uploadToCloudinary = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "feedback_specimens" },
                    (error, result) => {
                        if (result) resolve(result.secure_url);
                        else reject(error);
                    }
                );
                streamifier.createReadStream(buffer).pipe(stream);
            });
        };

        if (req.file) {
            imageUrl = await uploadToCloudinary(req.file.buffer);
        }

        // 3. Save to Registry
        const user = await userModel.findById(userId);
        const feedbackData = new feedbackModel({
            userId,
            userName: user?.name || "Anonymous Collector",
            orderId,
            orderNo,
            text: text || "",
            image: imageUrl,
            rating: Number(rating) || 5,
            date: Date.now()
        });

        await feedbackData.save();
        res.json({ success: true, message: "Feedback archived successfully" });

    } catch (error) {
        console.error("Archive Sync Error:", error);
        res.json({ success: false, message: error.message });
    }
};
// Admin: Feature feedback for home page
const toggleFeaturedFeedback = async (req, res) => {
    try {
        const { feedbackId, status } = req.body;
        await feedbackModel.findByIdAndUpdate(feedbackId, { isFeatured: status });
        res.json({ success: true, message: "Registry visibility updated" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// List Featured Feedback (For Home Page)
const getFeaturedFeedback = async (req, res) => {
    try {
        const testimonials = await feedbackModel.find({ isFeatured: true });
        res.json({ success: true, testimonials });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const listAllFeedback = async (req, res) => {
    try {
        const feedback = await feedbackModel.find({});
        res.json({ success: true, feedback });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const getUserFeedbacks = async (req, res) => {
    try {
        const { userId } = req.body; // Injected by your authUser middleware
        
        // We only need the orderId to handle the frontend button state
        const feedbacks = await feedbackModel.find({ userId }).select('orderId');
        
        res.json({ 
            success: true, 
            feedbacks: feedbacks.map(f => f.orderId) // Return an array of IDs
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const updateFeedback = async (req, res) => {
    try {
        // feedbackId identifies the document, the rest are fields to update
        const { feedbackId, text, rating, isFeatured } = req.body;

        const updatedFeedback = await feedbackModel.findByIdAndUpdate(
            feedbackId,
            { 
                text: text || "", 
                rating: Number(rating) || 5, 
                isFeatured: isFeatured // Toggle visibility for home page
            },
            { new: true, runValidators: true } // Returns the updated document
        );

        if (!updatedFeedback) {
            return res.json({ success: false, message: "Feedback record not found in registry." });
        }

        res.json({ 
            success: true, 
            message: "Consignment feedback modified successfully", 
            data: updatedFeedback 
        });
    } catch (error) {
        console.error("Admin Update Error:", error);
        res.json({ success: false, message: error.message });
    }
};

export { addFeedback, toggleFeaturedFeedback, getFeaturedFeedback ,listAllFeedback,getUserFeedbacks,updateFeedback};