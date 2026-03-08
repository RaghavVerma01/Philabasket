import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import productModel from './models/productModel.js';

dotenv.config();

// Configure with your credentials from Cloudinary Dashboard
cloudinary.config({ 
  cloud_name: 'darmvywhd', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const bulkMigrate = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const products = await productModel.find({ image: { $exists: true, $ne: [] } });

    console.log(`🚀 Starting migration for ${products.length} products...`);

    for (let product of products) {
        for (let oldUrl of product.image) {
            // Only migrate if it's a WordPress URL
            if (oldUrl.includes('https://www.philabasket.com/wp-content/uploads/2026/02/')) {
                try {
                    // This 'uploads' the remote URL directly to Cloudinary
                    const result = await cloudinary.uploader.upload(oldUrl, {
                        folder: "wp_images",
                        use_filename: true,
                        unique_filename: false,
                        overwrite: false
                    });
                    console.log(`✅ Saved: ${result.public_id}`);
                } catch (err) {
                    console.error(`❌ Failed: ${oldUrl} - ${err.message}`);
                }
            }
        }
    }
    console.log("🏁 Migration Complete!");
};

bulkMigrate();