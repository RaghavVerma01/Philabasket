import mediaModel from "../models/mediaModel.js";
import productModel from "../models/productModel.js";

const getAllMedia = async (req, res) => {
    try {
        // Fetching all media assets sorted by newest first
        const media = await mediaModel.find({}).sort({ _id: -1 });

        res.json({ 
            success: true, 
            media,
            message: "Media Registry Synchronized" 
        });
    } catch (error) {
        console.error("Media Fetch Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Internal Archive Error" 
        });
    }
};


// @desc    Sync orphaned media to products based on #XYZ- pattern
// @route   POST /api/product/sync-media
// @access  Private/Admin
const syncMediaToProducts = async (req, res) => {
    const DEFAULT_IMAGE = "https://res.cloudinary.com/darmvywhd/image/upload/v1773777548/Logo-5_asqxkr.png";

    try {
        const orphanedMedia = await mediaModel.find({ isAssigned: false });
        
        if (orphanedMedia.length === 0) {
            return res.json({ success: true, message: "Registry already synced.", matchCount: 0 });
        }

        let matchCount = 0;
        let syncLog = [];

        // --- UPDATED CONTROLLER LOGIC ---

        for (const asset of orphanedMedia) {
            // 1. FILENAME REGEX: Capture from '#' up to the first space, hyphen, or dot.
            // This correctly extracts 'B-UIQE-101' from '#B-UIQE-101.png'
            const fileMatch = asset.originalName.match(/#([A-Z0-9-]+)/i);
        
            if (fileMatch && fileMatch[1]) {
                const productCode = fileMatch[1].trim();
        
                // 2. PRODUCT SEARCH: Look for a product name that STARTS with this code
                // We use the '^' anchor in regex to say "must start with this"
                // This ensures '#ASL01' matches '#ASL01 - I Am Philatelist...'
                const product = await productModel.findOne({
                    name: { $regex: `^#${productCode}`, $options: 'i' }
                });
        
                if (product) {
                    // STEP 1: CLEANUP (Remove placeholders and existing copies)
                    await productModel.findByIdAndUpdate(product._id, {
                        $pull: { image: { $in: [DEFAULT_IMAGE, asset.imageUrl] } }
                    });
        
                    // STEP 2: PREPEND (Move to Index 0)
                    await productModel.findByIdAndUpdate(product._id, {
                        $push: { 
                            image: { 
                                $each: [asset.imageUrl], 
                                $position: 0 
                            } 
                        }
                    });
        
                    // Update media assignment status
                    await mediaModel.findByIdAndUpdate(asset._id, { isAssigned: true });
        
                    syncLog.push({
                        filename: asset.originalName,
                        productName: product.name,
                        codeFound: productCode
                    });
                    matchCount++;
                } else {
                    // LOGGING: Helps you see which codes didn't find a product
                    console.log(`Unmatched Code: [#${productCode}] from File: [${asset.originalName}]`);
                }
            }
        }

        console.log("--- Media Sync Report (Prioritized) ---");
        console.table(syncLog); 

        res.json({ 
            success: true, 
            message: "Sync Protocol Complete (Images Prioritized)", 
            matchCount,
            syncLog 
        });

    } catch (error) {
        console.error("Sync Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { syncMediaToProducts, getAllMedia };

