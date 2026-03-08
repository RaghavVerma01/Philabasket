import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
// Import your product model
import productModel from './models/productModel.js';
// import productModel from './models/productModel.js'; 
dotenv.config()

const triggerCloudinaryMigration = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/e-commerce`)

        console.log("Connected to DB...");

        const products = await productModel.find({});
        console.log(`Found ${products.length} products to migrate.`);

        const cloudinaryBase = "https://res.cloudinary.com/darmvywhd/image/upload/demofolder/";
        const wpBase = "https://www.philabasket.com/wp-content/uploads/2026/03/";

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            
            for (let oldUrl of product.image) {
                // Construct the Cloudinary URL by replacing the base
                const cldUrl = oldUrl.replace(wpBase, cloudinaryBase);
                
                try {
                    // We only need a HEAD request to trigger the fetch
                    // This saves bandwidth while still forcing Cloudinary to pull the file
                    await axios.head(cldUrl);
                    console.log(`[SUCCESS] Fetched: ${product.name}`);
                } catch (err) {
                    console.error(`[FAILED] ${cldUrl} - Error: ${err.message}`);
                }
            }
            
            // Small delay to prevent hitting rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log("Migration Trigger Complete. Check your Cloudinary Media Library!");
    } catch (error) {
        console.error("Migration Error:", error);
    }
};

triggerCloudinaryMigration();