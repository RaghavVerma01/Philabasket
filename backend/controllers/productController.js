import { v2 as cloudinary } from "cloudinary"
import mongoose from "mongoose";
import productModel from "../models/productModel.js"
import csv from 'csv-parser';
import streamifier from 'streamifier';
import { Readable } from 'stream';
import mediaModel from '../models/mediaModel.js';
import categoryModel from "../models/categoryModel.js";

// --- CLOUDINARY HELPERS ---
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { 
                folder: "philabasket_products",
                transformation: [{ fetch_format: "auto", quality: "auto" }] // AUTO-OPTIMIZE
            },
            (error, result) => {
                if (result) {
                    // Inject optimization tags into the URL string
                    const optimizedUrl = result.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
                    resolve(optimizedUrl);
                }
                else reject(error);
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

// --- MEDIA REGISTRY LOGIC ---
const uploadMedia = async (req, res) => {
    try {
        const { originalName } = req.body;
        const imageFile = req.file;
        if (!imageFile) return res.json({ success: false, message: "No asset detected" });

        const cld_upload_stream = cloudinary.uploader.upload_stream(
            { 
                folder: "stamp_registry", 
                resource_type: "image",
                transformation: [{ fetch_format: "auto", quality: "auto" }] 
            },
            async (error, result) => {
                if (error) return res.json({ success: false, message: "Cloudinary upload failed" });
                
                const optimizedUrl = result.secure_url.replace('/upload/', '/upload/f_auto,q_auto/');
                
                // ADDED: Capture result.public_id
                await mediaModel.findOneAndUpdate(
                    { originalName: originalName },
                    { 
                        imageUrl: optimizedUrl, 
                        public_id: result.public_id, // Store this for deletion
                        isAssigned: false 
                    },
                    { upsert: true, new: true }
                );
                res.json({ success: true, message: `Asset ${originalName} synchronized.` });
            }
        );
        cld_upload_stream.end(imageFile.buffer);
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
const listMedia = async (req, res) => {
    try {
        const media = await mediaModel.find({}).sort({ _id: -1 }).lean(); // Added .lean() for speed
        res.json({ success: true, media });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// --- BULK ADD LOGIC (The Working Version - Optimized) ---


// import { Readable } from 'stream';
// import csv from 'csv-parser';
// import productModel from '../models/productModel.js';
// import mediaModel from '../models/mediaModel.js';
// import categoryModel from '../models/categoryModel.js';

// import { Readable } from 'stream';
// import csv from 'csv-parser';
// import productModel from '../models/productModel.js';
// import mediaModel from '../models/mediaModel.js';
// import categoryModel from '../models/categoryModel.js';






const bulkAddProducts = async (req, res) => {
    try {
        if (!req.file) return res.json({ success: false, message: "Please upload a CSV file" });

        const stamps = [];
        const usedImageNames = [];
        const discoveredCategories = new Map(); 
        
        // Fallback Image URL
        const DEFAULT_IMAGE = "https://res.cloudinary.com/dvsdithxh/image/upload/v1770344955/Logo-5_nqnyl4.png";

        const [existingStamps, allMedia] = await Promise.all([
            productModel.find({}, 'name').lean(),
            mediaModel.find({}, 'originalName imageUrl').lean()
        ]);

        const existingNames = new Set(existingStamps.map(s => s.name.toLowerCase().trim()));

        const extractBkId = (name) => {
            if (!name) return null;
            const match = String(name).match(/BK\d+/i);
            return match ? match[0].toUpperCase() : null;
        };

        const mediaVariantMap = new Map();
        allMedia.forEach(m => {
            const bid = extractBkId(m.originalName);
            if (bid) {
                if (!mediaVariantMap.has(bid)) mediaVariantMap.set(bid, []);
                let url = m.imageUrl;
                if (url.includes('cloudinary.com') && !url.includes('f_auto')) {
                    url = url.replace('/upload/', '/upload/f_auto,q_auto/');
                }
                mediaVariantMap.get(bid).push({ url: url, originalName: m.originalName });
            }
        });

        const stream = Readable.from(req.file.buffer);

        stream.pipe(csv({
            mapHeaders: ({ header }) => header.trim().replace(/^["']|["']$/g, ''), 
            strict: false 
        }))
        .on('data', (row) => {
            try {
                const clean = (val) => val ? String(val).trim().replace(/^["'\[]|["'\]]$/g, '').trim() : "";
                const nameTrimmed = clean(row.name || Object.values(row)[0]);

                // Skip only if the name is completely empty or already exists
                if (!nameTrimmed || existingNames.has(nameTrimmed.toLowerCase())) return;

                // --- IMAGE BUNDLING ---
                const primaryCsvImg = clean(row.imageName1);
                const baseId = extractBkId(primaryCsvImg);
                
                let productImages = [];
                
                // Attempt to find matching images in Media Registry
                if (baseId && mediaVariantMap.has(baseId)) {
                    const variants = mediaVariantMap.get(baseId);
                    variants.sort((a, b) => {
                        const isA_Var = a.originalName.includes('(') || a.originalName.includes('-');
                        const isB_Var = b.originalName.includes('(') || b.originalName.includes('-');
                        if (!isA_Var && isB_Var) return -1;
                        if (isA_Var && !isB_Var) return 1;
                        return a.originalName.length - b.originalName.length;
                    });
                    productImages = variants.map(v => v.url);
                    variants.forEach(v => usedImageNames.push(v.originalName));
                }

                // FIX: If no images were found, use the Cloudinary fallback instead of returning
                if (productImages.length === 0) {
                    productImages = [DEFAULT_IMAGE];
                }

                // --- CATEGORY COUNTING ---
                let parsedCategory = [];
                const rawCat = clean(row.category);
                if (rawCat) {
                    parsedCategory = rawCat.split(',').map(c => c.trim()).filter(c => c !== "");
                    parsedCategory.forEach(cat => {
                        discoveredCategories.set(cat, (discoveredCategories.get(cat) || 0) + 1);
                    });
                }

                const mPrice = Number(String(row.marketPrice || 0).replace(/[^0-9.]/g, '')) || 0;
                const rowPrice = Number(String(row.price || 0).replace(/[^0-9.]/g, ''));
                const finalPrice = rowPrice || mPrice;

                stamps.push({
                    name: nameTrimmed,
                    description: clean(row.description) || "Historical philatelic specimen.",
                    marketPrice: mPrice,
                    price: finalPrice,
                    image: productImages,
                    youtubeUrl: clean(row.youtubeUrl),
                    category: parsedCategory,
                    year: Number(row.year) || 0,
                    country: clean(row.country) || "India",
                    producedCount: Number(String(row.producedCount || 0).replace(/[^0-9]/g, '')) || 0, 
                    condition: clean(row.condition) || "Mint",
                    stock: Number(row.stock) || 1,
                    bestseller: String(row.bestseller || '').toLowerCase().trim() === 'true',
                    newArrival: String(row.newArrival || '').toLowerCase().trim() === 'true',
                    isActive: true,
                    date: Date.now()
                });

            } catch (err) { console.error(`Row Processing Error:`, err); }
        })
        .on('end', async () => {
            try {
                if (stamps.length === 0) return res.json({ success: false, message: "No new items to add." });

                const categoryOps = Array.from(discoveredCategories).map(([name, count]) => ({
                    updateOne: {
                        filter: { name },
                        update: { 
                            $inc: { productCount: count }, 
                            $setOnInsert: { group: "Independent" } 
                        },
                        upsert: true 
                    }
                }));

                if (categoryOps.length > 0) await categoryModel.bulkWrite(categoryOps);
                
                // insertMany with ordered:false ensures that if one row fails, others still upload
                await productModel.insertMany(stamps, { ordered: false });
                
                if (usedImageNames.length > 0) {
                    await mediaModel.updateMany(
                        { originalName: { $in: usedImageNames } }, 
                        { $set: { isAssigned: true } }
                    );
                }
                
                res.json({ success: true, message: `Registry Synced. Added ${stamps.length} Specimens.` });
            } catch (dbErr) { 
                res.json({ success: false, message: "Partial sync or DB error: " + dbErr.message }); 
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- CORE CRUD (Upgraded for 100k+ Items) ---
// const listProducts = async (req, res) => {
//     try {
//         // ADDED: Server-side pagination support for the Infinite Scroll frontend
//         const page = parseInt(req.query.page) || 1;
//         const limit = parseInt(req.query.limit) || 20;
//         const skip = (page - 1) * limit;

//         const { category, sort, search } = req.query;
//         let query = {};

//         // PERFORMANCE: Use Text Index if searching
//         if (search) {
//             query.$text = { $search: search };
//         }

//         if (category) {
//             query.category = { $in: category.split(',') };
//         }

//         let sortOrder = search ? { score: { $meta: "textScore" } } : { date: -1 };

//         // Logic choice: If sort is requested via query, use it
//         if (sort === 'low-high') sortOrder = { price: 1 };
//         if (sort === 'high-low') sortOrder = { price: -1 };

//         const products = await productModel.find(query)
//             .select('-description') // Do not load description in the list view (Saves bandwidth)
//             .sort(sortOrder)
//             .skip(skip)
//             .limit(limit)
//             .lean(); // Returns plain JS objects (Much faster)

//         const total = await productModel.countDocuments(query);

//         res.json({ 
//             success: true, 
//             products, 
//             total,
//             hasMore: total > skip + limit 
//         });
//     } catch (error) {
//         res.json({ success: false, message: error.message });
//     }
// };

// --- UPDATED listProducts CONTROLLER ---

// import categoryModel from '../models/categoryModel.js'; // Ensure this is imported

const listProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const { 
            category, 
            group, 
            sort, 
            search, 
            includeHidden, 
            onlyHidden, // New parameter for Trash view
            bestseller, 
            newArrival 
        } = req.query;
        
        // --- 1. BASE QUERY ---
        let query = {};

        /**
         * VISIBILITY LOGIC
         * - onlyHidden: returns only items in Trash (isActive: false)
         * - includeHidden != true: returns only Active items (isActive: true)
         * - includeHidden == true: returns everything
         */
        if (onlyHidden === 'true') {
            query.isActive = false;
        } else if (includeHidden !== 'true') {
            query.isActive = true;
        }

        if (bestseller === 'true') {
            query.bestseller = true;
        }
        
        if (newArrival === 'true') {
            query.newArrival = true;
        }

        // --- 2. LAYERED FILTERS (Search & Categories) ---
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { name: { $regex: searchRegex } },
                { country: { $regex: searchRegex } },
                { category: { $regex: searchRegex } }
            ];
        }

        let categoryFilter = [];
        if (category && category !== "") {
            categoryFilter = category.split(',');
        } else if (group && group !== "") {
            const categoriesInGroup = await categoryModel.find({ group: group }).select('name').lean();
            categoryFilter = categoriesInGroup.map(cat => cat.name);
        }

        if (categoryFilter.length > 0) {
            query.category = { $in: categoryFilter };
        }

        // --- 3. SORT LOGIC ---
        let sortOrder = { date: -1 };
        if (sort === 'price-low') sortOrder = { price: 1 };
        if (sort === 'price-high') sortOrder = { price: -1 };
        if (sort === 'year-new') sortOrder = { year: -1 };

        // --- 4. EXECUTION ---
        // countDocuments(query) now accurately reflects the current tab (Active or Trash)
        const [products, total] = await Promise.all([
            productModel.find(query)
                .select('name price marketPrice image category country condition year stock date bestseller description youtubeUrl isActive isLatest newArrival producedCount')
                .sort(sortOrder)
                .skip(skip)
                .limit(limit)
                .lean(), 
            productModel.countDocuments(query)
        ]);

        // Inside your listProducts controller
const totalActive = await productModel.countDocuments({ isActive: true });
const totalTrash = await productModel.countDocuments({ isActive: false });

res.json({ 
    success: true, 
    products, 
    total, // Count for the current filtered view (for pagination)
    stats: {
        active: totalActive,
        trash: totalTrash
    },
    hasMore: total > (skip + products.length) 
});

        // res.json({ 
        //     success: true, 
        //     products, 
        //     total, // This is the total for the specific filter/view
        //     hasMore: total > (skip + products.length) 
        // });

    } catch (error) {
        console.error("Registry Query Error:", error);
        res.status(500).json({ success: false, message: "Registry Sync Error" });
    }
};
const addProduct = async (req, res) => {
    try {
        const { 
            name, description, price, marketPrice, category, 
            year, condition, country, stock, producedCount,
            bestseller, newArrival, imageName 
        } = req.body;

        let imagesUrl = [];
        const imageFiles = [
            req.files?.image1?.[0], 
            req.files?.image2?.[0], 
            req.files?.image3?.[0], 
            req.files?.image4?.[0]
        ].filter(Boolean);

        // --- IMAGE HANDLING ---
        if (imageFiles.length > 0) {
            imagesUrl = await Promise.all(imageFiles.map(i => uploadToCloudinary(i.buffer)));
        } else if (imageName) {
            const mediaRecord = await mediaModel.findOne({ originalName: imageName.trim() }).lean();
            if (mediaRecord) {
                imagesUrl = [mediaRecord.imageUrl];
                // Mark as assigned in your media registry
                await mediaModel.updateOne({ _id: mediaRecord._id }, { $set: { isAssigned: true } });
            }
        }

        // --- BUILD SPECIMEN OBJECT ---
        const product = new productModel({
            name,
            description,
            price: Number(price),
            marketPrice: Number(marketPrice) || 0,
            category: Array.isArray(category) ? category : JSON.parse(category),
            year: Number(year),
            producedCount: Number(producedCount) || 0, // New Field
            condition,
            country,
            stock: Number(stock),
            // STRICT BOOLEAN CHECK: Defaults to false unless string "true" is passed
            bestseller: bestseller === "true", 
            newArrival: newArrival === "true", // New Field
            image: imagesUrl,
            date: Date.now()
        });

        await product.save();
        res.json({ success: true, message: "Product Added to Registry" });

    } catch (error) {
        console.error("Add Product Error:", error);
        res.json({ success: false, message: error.message });
    }
};

const singleProduct = async (req, res) => {
    try {
        const product = await productModel.findById(req.body.productId).lean();
        res.json({ success: true, product });
    } catch (error) { res.json({ success: false, message: error.message }); }
};

export const bulkUpdateAttributes = async (req, res) => {
    try {
        const { ids, field, value } = req.body;

        const allowedFields = ['bestseller', 'newArrival', 'isActive', 'isLatest'];
        if (!allowedFields.includes(field)) {
            return res.json({ success: false, message: "Invalid attribute update" });
        }

        // --- NEW: Sync counts if field is isActive ---
        if (field === 'isActive') {
            const affectedProducts = await productModel.find({ _id: { $in: ids } }, 'category isActive').lean();
            const categoryFreqMap = new Map();

            affectedProducts.forEach(p => {
                if (p.isActive !== value && p.category) {
                    p.category.forEach(cat => categoryFreqMap.set(cat, (categoryFreqMap.get(cat) || 0) + 1));
                }
            });

            const categoryOps = Array.from(categoryFreqMap).map(([name, count]) => ({
                updateOne: {
                    filter: { name },
                    update: { $inc: { productCount: value ? count : -count } }
                }
            }));

            if (categoryOps.length > 0) await categoryModel.bulkWrite(categoryOps);
        }

        await productModel.updateMany(
            { _id: { $in: ids } },
            { $set: { [field]: value } }
        );

        res.json({ success: true, message: `Registry updated: ${field} set to ${value}` });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};


// Function to fetch a single product detail by ID
const singleProduct1 = async (req, res) => {
    try {
        // Since we use .get with params, use req.query
        const { productId } = req.query; 
        
        const product = await productModel.findById(productId).lean();
        
        if (product) {
            res.json({ success: true, product });
        } else {
            res.json({ success: false, message: "Specimen not found" });
        }
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// Ensure you export it
// Bulk toggle visibility (isActive)
// Bulk toggle visibility (isActive)
export const bulkUpdateStatus = async (req, res) => {
    try {
        const { ids, isActive } = req.body;

        // 1. Find the products to see which categories are affected
        const affectedProducts = await productModel.find({ _id: { $in: ids } }, 'category isActive').lean();
        
        const categoryFreqMap = new Map();
        affectedProducts.forEach(product => {
            // Only update counts if the status is actually changing
            if (product.isActive !== isActive && product.category) {
                product.category.forEach(cat => {
                    categoryFreqMap.set(cat, (categoryFreqMap.get(cat) || 0) + 1);
                });
            }
        });

        // 2. Prepare Category Operations
        const categoryOps = [];
        categoryFreqMap.forEach((count, name) => {
            categoryOps.push({
                updateOne: {
                    filter: { name },
                    // If moving to active, increment. If moving to trash, decrement.
                    update: { $inc: { productCount: isActive ? count : -count } }
                }
            });
        });

        // 3. Execute Updates
        if (categoryOps.length > 0) {
            await categoryModel.bulkWrite(categoryOps);
        }

        await productModel.updateMany(
            { _id: { $in: ids } },
            { $set: { isActive: isActive } }
        );

        res.json({ 
            success: true, 
            message: `${ids.length} Specimens moved to ${isActive ? 'Active' : 'Trash'}` 
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

const removeProduct = async (req, res) => {
    try {
        const productId = req.body.id;

        // 1. Find the product to get its categories
        const product = await productModel.findById(productId);
        if (!product) return res.json({ success: false, message: "Specimen not found" });

        const categories = product.category || [];

        // 2. Decrement the count for each category this product belongs to
        if (categories.length > 0) {
            await categoryModel.updateMany(
                { name: { $in: categories } },
                { $inc: { productCount: -1 } }
            );
        }

        // 3. Delete the product
        await productModel.findByIdAndDelete(productId);

        res.json({ success: true, message: "Stamp Removed and Registry Updated" });
    } catch (error) { 
        res.json({ success: false, message: error.message }); 
    }
};

const removeBulkProducts = async (req, res) => {
    try {
        const { ids } = req.body;

        // 1. Find all products being deleted to gather their categories
        const productsToDelete = await productModel.find({ _id: { $in: ids } }, 'category');
        
        const categoryFreqMap = new Map();

        // 2. Count occurrences of each category in the deletion set
        productsToDelete.forEach(product => {
            if (product.category && Array.isArray(product.category)) {
                product.category.forEach(cat => {
                    categoryFreqMap.set(cat, (categoryFreqMap.get(cat) || 0) + 1);
                });
            }
        });

        // 3. Prepare bulk operations to decrement category counts
        const categoryOps = [];
        categoryFreqMap.forEach((count, name) => {
            categoryOps.push({
                updateOne: {
                    filter: { name },
                    update: { $inc: { productCount: -count } }
                }
            });
        });

        // 4. Execute category updates and product deletions
        if (categoryOps.length > 0) {
            await categoryModel.bulkWrite(categoryOps);
        }
        await productModel.deleteMany({ _id: { $in: ids } });

        res.json({ 
            success: true, 
            message: `${ids.length} Stamps removed and Registry counts adjusted` 
        });
    } catch (error) { 
        res.json({ success: false, message: error.message }); 
    }
};

// controllers/productController.js

const updateProduct = async (req, res) => {
    try {
        const { id, ...updateData } = req.body;

        const oldProduct = await productModel.findById(id).lean();
        if (!oldProduct) return res.json({ success: false, message: "Specimen not found" });

        // --- IMAGE REGISTRY RESOLUTION ---
        if (updateData.image && Array.isArray(updateData.image)) {
            const resolvedMedia = await mediaModel.find({
                originalName: { $in: updateData.image }
            });
            
            const finalImageUrls = updateData.image.map(name => {
                if (name.startsWith('http')) return name;
                const found = resolvedMedia.find(m => m.originalName === name);
                return found ? found.imageUrl : null;
            }).filter(url => url !== null);

            updateData.image = finalImageUrls;
        }

        // --- CATEGORY DELTA SYNC ---
        if (updateData.category && Array.isArray(updateData.category)) {
            const added = updateData.category.filter(x => !oldProduct.category.includes(x));
            const removed = oldProduct.category.filter(x => !updateData.category.includes(x));

            if (added.length > 0) {
                await categoryModel.updateMany({ name: { $in: added } }, { $inc: { productCount: 1 } });
            }
            if (removed.length > 0) {
                await categoryModel.updateMany({ name: { $in: removed } }, { $inc: { productCount: -1 } });
            }
        }

        // --- NEW: Philatelic & Inventory Normalization ---
        if (updateData.price) {
            updateData.price = Number(updateData.price);
            updateData.rewardPoints = Math.floor(updateData.price * 0.10);
        }
        
        if (updateData.stock !== undefined) {
            updateData.stock = Number(updateData.stock);
        }

        if (updateData.producedCount !== undefined) {
            updateData.producedCount = Number(updateData.producedCount);
        }

        if (updateData.year !== undefined) {
            updateData.year = Number(updateData.year);
        }

        if (updateData.country) {
            // Trim and maintain consistent casing if needed
            updateData.country = updateData.country.trim();
        }

        // Ensure boolean fields are correctly handled if sent from form data
        ['bestseller', 'newArrival', 'isActive'].forEach(field => {
            if (updateData[field] !== undefined) {
                updateData[field] = updateData[field] === true || updateData[field] === 'true';
            }
        });

        // --- DATABASE UPDATE ---
        const updatedProduct = await productModel.findByIdAndUpdate(
            id, 
            { $set: updateData }, 
            { new: true, runValidators: true }
        );

        res.json({ 
            success: true, 
            message: "Registry Record Updated Successfully", 
            product: updatedProduct 
        });

    } catch (error) {
        console.error("Update Error:", error);
        res.json({ success: false, message: error.message });
    }
};

export const updateProductImages = async (req, res) => {
    try {
        const { id } = req.body;

        // 1. Fetch the existing product to get current images
        const product = await productModel.findById(id);
        if (!product) {
            return res.json({ success: false, message: "Specimen not found" });
        }

        // 2. Extract files from Multer
        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

        // 3. Upload new images to Cloudinary
        // We use Promise.all to upload all images simultaneously for speed
        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { 
                    resource_type: 'image',
                    folder: 'stamp_registry' // Optional: keeps your Cloudinary organized
                });
                return result.secure_url;
            })
        );

        // 4. Update Strategy: 
        // If the admin uploaded NEW images, we replace the array. 
        // If no files were sent, we keep the old ones.
        const updatedImages = imagesUrl.length > 0 ? imagesUrl : product.image;

        await productModel.findByIdAndUpdate(id, { image: updatedImages });

        res.json({ 
            success: true, 
            message: "Visual Archive Updated", 
            images: updatedImages 
        });

    } catch (error) {
        console.error("Image Update Error:", error);
        res.json({ success: false, message: error.message });
    }
};

const updateMediaName = async (req, res) => {
    try {
        const { id, newName } = req.body;
        
        const updatedMedia = await mediaModel.findByIdAndUpdate(
            id, 
            { originalName: newName }, 
            { new: true }
        );

        if (!updatedMedia) {
            return res.json({ success: false, message: "Asset not found" });
        }

        res.json({ success: true, message: "Filename updated in registry" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const deleteMedia = async (req, res) => {
    try {
        const { ids } = req.body; // Array of MongoDB _ids

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.json({ success: false, message: "No assets selected" });
        }

        // 1. Fetch assets to get Cloudinary public_ids
        const assetsToDelete = await mediaModel.find({ _id: { $in: ids } }).select('public_id');
        
        // Filter out any records that might be missing a public_id
        const publicIds = assetsToDelete
            .map(asset => asset.public_id)
            .filter(id => id != null);

        // 2. Delete from Cloudinary
        if (publicIds.length > 0) {
            // cloudinary.api.delete_resources can handle up to 100 IDs per call
            await cloudinary.api.delete_resources(publicIds);
        }

        // 3. Delete from MongoDB
        const deleteResult = await mediaModel.deleteMany({ _id: { $in: ids } });

        res.json({ 
            success: true, 
            message: `${deleteResult.deletedCount} assets purged from registry and Cloudinary.` 
        });
    } catch (error) {
        console.error("Purge Error:", error);
        res.json({ success: false, message: "Purge failed: " + error.message });
    }
}


export const uploadSingleImage = async (req, res) => {
    try {
        const imageFile = req.files && req.files.image1 && req.files.image1[0];
        if (!imageFile) return res.json({ success: false, message: "Missing image" });

        const result = await cloudinary.uploader.upload_stream(
            { 
                resource_type: 'image', 
                folder: 'mail_banners',
                transformation: [{ width: 1200, height: 400, crop: "fill", gravity: "center", fetch_format: "auto", quality: "auto" }] 
            },
            (error, result) => {
                if (error) return res.json({ success: false, message: error.message });
                res.json({ success: true, imageUrl: result.secure_url });
            }
        ).end(imageFile.buffer);
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export const getRecentlyUpdated = async (req, res) => {
    try {
        // Fetch products updated in the last 7 days, sorted by updatedAt
        const products = await productModel.find({})
            .sort({ updatedAt: -1 }) // Newest updates first
            .limit(30); // Limit to top 20 recent changes

        res.json({ success: true, products });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export { 
    listProducts, addProduct, removeProduct, singleProduct, 
    updateProduct, removeBulkProducts, bulkAddProducts, uploadMedia, listMedia ,singleProduct1,updateMediaName,deleteMedia
};