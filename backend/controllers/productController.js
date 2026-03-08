import { v2 as cloudinary } from "cloudinary"
import mongoose from "mongoose";
import productModel from "../models/productModel.js"
import csv from 'csv-parser';
import streamifier from 'streamifier';
import { Readable } from 'stream';
import mediaModel from '../models/mediaModel.js';
import categoryModel from "../models/categoryModel.js";
import userModel from "../models/userModel.js";
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
dotenv.config()

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendUpdateEmails = async (products) => {
    try {
        const users = await userModel.find({}, 'email name');
        console.log(`--- INITIALIZING RESEND DISPATCH FOR ${users.length} USERS ---`);

        // Resend allows batching easily
        for (let i = 0; i < users.length; i += 100) { // Resend handles larger batches (up to 100)
            const batch = users.slice(i, i + 100);
            
            await Promise.all(batch.map(user => 
                resend.emails.send({
                    from: 'Registry <updates@philabasket.com>', // Requires domain verification
                    to: user.email,
                    subject: 'Registry Update: New Specimens Archived',
                    html: `
                    <div style="background-color: #f4f4f4; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden; shadow: 0 4px 10px rgba(0,0,0,0.05);">
                            
                            <tr>
                                <td align="center" style="padding: 40px 0; background-color: #000000;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase;">
                                        Phila<span style="color: #BC002D;">Basket</span>
                                    </h1>
                                    <div style="height: 2px; width: 40px; background-color: #BC002D; margin-top: 10px;"></div>
                                    <p style="color: #888888; font-size: 9px; margin-top: 15px; letter-spacing: 4px; font-weight: bold; text-transform: uppercase;">
                                        Archive Synchronization Report
                                    </p>
                                </td>
                            </tr>
                
                            <tr>
                                <td style="padding: 40px 40px 20px 40px;">
                                    <p style="color: #999999; font-size: 10px; font-weight: 800; text-transform: uppercase; tracking: 2px; margin-bottom: 10px;">
                                        Attention: ${user.name || 'Collector'}
                                    </p>
                                    <h2 style="color: #1a1a1a; font-size: 22px; font-weight: 800; margin: 0; line-height: 1.2;">
                                        The following specimens have been successfully added to the global registry.
                                    </h2>
                                </td>
                            </tr>
                
                            <tr>
                                <td style="padding: 20px 40px;">
                                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                        ${products.map(p => `
                                        <tr>
                                            <td style="padding: 20px 0; border-bottom: 1px solid #f0f0f0;">
                                                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td width="110" valign="top" style="padding-right: 20px;">
                                                            <div style="border: 1px solid #eeeeee; padding: 4px; background-color: #f9f9f9; border-radius: 4px;">
                                                                <img src="${p.image[0]}" alt="${p.name}" width="100" height="100" style="display: block; object-fit: cover; border-radius: 2px;">
                                                            </div>
                                                        </td>
                                                        <td valign="top" style="padding-top: 5px;">
                                                            <p style="margin: 0; font-size: 10px; color: #BC002D; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">
                                                                Specimen ID: ${p._id.toString().slice(-6).toUpperCase()}
                                                            </p>
                                                            <h3 style="margin: 5px 0; font-size: 15px; font-weight: 800; color: #1a1a1a; text-transform: uppercase; line-height: 1.3;">
                                                                ${p.name}
                                                            </h3>
                                                            <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 900; color: #000000;">
                                                                ₹${p.price.toLocaleString('en-IN')}
                                                            </p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        `).join('')}
                                    </table>
                                </td>
                            </tr>
                
                            <tr>
                                <td align="center" style="padding: 40px;">
                                    <a href="https://philabasket.com/collection" style="background-color: #BC002D; color: #ffffff; padding: 20px 40px; text-decoration: none; font-size: 12px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; display: inline-block; border-radius: 4px; box-shadow: 0 4px 15px rgba(188, 0, 45, 0.2);">
                                        Enter Global Archive
                                    </a>
                                </td>
                            </tr>
                
                            <tr>
                                <td align="center" style="padding: 30px; background-color: #1a1a1a;">
                                    <p style="color: #666666; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; margin: 0;">
                                        Secure Philatelic Protocol • Batch ID: ${new Date().getTime().toString().slice(-6)}
                                    </p>
                                    <p style="color: #444444; font-size: 8px; margin-top: 15px; line-height: 1.5;">
                                        This is an automated intelligence report from PhilaBasket. <br>
                                        © 2026 PhilaBasket Global Registry. All Rights Reserved.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </div>
                    `
                })
            ));
            
            console.log(`[RESEND] Batch delivered to ${batch.length} collectors.`);
        }
    } catch (error) {
        console.error("Resend System Error:", error);
    }
};

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
        const DEFAULT_IMAGE = "https://res.cloudinary.com/dvsdithxh/image/upload/v1770344955/Logo-5_nqnyl4.png";

        // 1. Fetch existing data for matching
        const [existingStamps, allMedia] = await Promise.all([
            productModel.find({}, 'name').lean(),
            mediaModel.find({}, 'originalName imageUrl').lean()
        ]);

        const existingNames = new Set(existingStamps.map(s => s.name.toLowerCase().trim()));

        // --- IMPROVED UNIVERSAL ID EXTRACTION ---
        // This targets the "#xyz" pattern specifically, but falls back to alphanumeric strings
        const extractSpecimenId = (name) => {
            if (!name) return null;
            // Matches anything starting with # OR the first block of letters/numbers
            const match = String(name).match(/(#[a-z0-9]+|[a-z0-9]+)/i);
            return match ? match[0].toUpperCase() : null;
        };

        // 2. Map Media Gallery by the extracted ID
        const mediaVariantMap = new Map();
        allMedia.forEach(m => {
            const sid = extractSpecimenId(m.originalName);
            if (sid) {
                if (!mediaVariantMap.has(sid)) mediaVariantMap.set(sid, []);
                mediaVariantMap.get(sid).push({ url: m.imageUrl, originalName: m.originalName });
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
                
                // Allow ALL names, but skip only if truly identical to avoid DB crashes
               

        // --- EXCEL-FRIENDLY DATE NORMALIZATION ---

        
        const nameTrimmed = clean(row.name || Object.values(row)[0]);
        if (!nameTrimmed) return; 

        if (existingNames.has(nameTrimmed.toLowerCase())) {
            console.log(`Skipping duplicate: ${nameTrimmed}`);
            return; 
        }

        // --- EXCEL-FRIENDLY DATE NORMALIZATION ---
        const normalizeDate = (val) => {
            let raw = clean(val);
            if (!raw) return "";
            
            // Replace dashes or dots with slashes (Excel often uses 11-12-2024)
            raw = raw.replace(/[\.\-]/g, '/');
            
            // Validate if it matches DD/MM/YYYY after replacement
            return /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(raw) ? raw : "";
        }; 

                if (existingNames.has(nameTrimmed.toLowerCase())) {
                    console.log(`Skipping duplicate: ${nameTrimmed}`);
                    return; // This stops the row from being added to 'stamps'
                }
                
                // --- LENIENT IMAGE MATCHING ---
                const primaryCsvImg = clean(row.imageName1);
                const baseId = extractSpecimenId(primaryCsvImg);
                let productImages = [];
                
                if (baseId && mediaVariantMap.has(baseId)) {
                    const variants = mediaVariantMap.get(baseId);
                    // Standard Sort: Main image first, variants (with brackets/dashes) after
                    variants.sort((a, b) => a.originalName.length - b.originalName.length);
                    productImages = variants.map(v => v.url);
                    variants.forEach(v => usedImageNames.push(v.originalName));
                }

                // If no match, show default logo instead of failing
                if (productImages.length === 0) productImages = [DEFAULT_IMAGE];

                // --- CATEGORY CLEANING (Removes [ ] brackets) ---
                let parsedCategory = [];
                const rawCat = clean(row.category).replace(/[\[\]]/g, '');
                if (rawCat) {
                    parsedCategory = rawCat.split(',').map(c => c.trim()).filter(c => Boolean);
                    parsedCategory.forEach(cat => {
                        discoveredCategories.set(cat, (discoveredCategories.get(cat) || 0) + 1);
                    });
                }

                // --- DATA NORMALIZATION ---
                const mPrice = Number(String(row.marketPrice || 0).replace(/[^0-9.]/g, '')) || 0;
                const rowPrice = Number(String(row.price || 0).replace(/[^0-9.]/g, ''));
                
                stamps.push({
                    name: nameTrimmed,
                    description: clean(row.description) || "Historical philatelic specimen.",
                    description2: clean(row.description2) || "",
                    marketPrice: mPrice,
                    price: rowPrice || mPrice,
                    image: productImages,
                    youtubeUrl: clean(row.youtubeUrl),
                    releaseDate: normalizeDate(row.releaseDate)||"",
                    category: parsedCategory,
                    year: Number(row.year) || 0,
                    country: clean(row.country) || "India",
                    producedCount: Number(String(row.producedCount || 0).replace(/[^0-9]/g, '')) || 0, 
                    condition: clean(row.condition) || "Mint",
                    stock: Number(row.stock) || 1,
                    bestseller: String(row.bestseller || '').toLowerCase() === 'true',
                    newArrival: String(row.newArrival || '').toLowerCase() === 'true',
                    blogLink: clean(row.blogLink),
                    isActive: true,
                    date: Date.now()
                });

            } catch (err) { console.error(`Row Processing Error:`, err); }
        })
        .on('end', async () => {
            try {
                if (stamps.length === 0) return res.json({ success: false, message: "No valid data found." });

                // Bulk Category Sync
                const categoryOps = Array.from(discoveredCategories).map(([name, count]) => ({
                    updateOne: {
                        filter: { name },
                        update: { $inc: { productCount: count }, $setOnInsert: { group: "Independent" } },
                        upsert: true 
                    }
                }));
                if (categoryOps.length > 0) await categoryModel.bulkWrite(categoryOps);
                
                // DATA INSERTION
                const result = await productModel.insertMany(stamps, { ordered: false });
                
                // Sync Media Assignment
                if (usedImageNames.length > 0) {
                    await mediaModel.updateMany(
                        { originalName: { $in: usedImageNames } }, 
                        { $set: { isAssigned: true } }
                    );
                }
                
                res.json({ success: true, message: `Successfully registered ${result.length} items.` });
            } catch (dbErr) { 
                // Handle partial success (some duplicates might fail, but others pass)
                const count = dbErr.result?.nInserted || 0;
                res.json({ success: true, message: `Partial Sync: ${count} items added.` }); 
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




// Optimized API for Admin Order Editing (Modal search)
export const listProductsForAdminEdit = async (req, res) => {
    try {
        // We fetch basic fields for all items, including hidden ones
        // No pagination here to ensure the admin can search the entire registry
        const products = await productModel.find({})
            .select('name price image category isActive stock')
            .sort({ name: 1 }) // Alphabetical for easier manual browsing
            .lean();

        res.json({ 
            success: true, 
            products 
        });

    } catch (error) {
        console.error("Admin Edit Registry Error:", error);
        res.json({ success: false, message: "Failed to access master registry" });
    }
};



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
            isFeatured,
            newArrival ,
            outOfStock
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
        if (isFeatured === 'true') query.isFeatured = true;

        if (outOfStock === 'true') {
            // Find products where stock is 0 or less
            query.stock = { $lte: 0 }; 
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
        // --- 3. SORT LOGIC ---
let sortOrder = { date: -1 }; // Default: Recent Arrivals

switch (sort) {
    case 'price-low':
        sortOrder = { price: 1 };
        break;
    case 'price-high':
        sortOrder = { price: -1 };
        break;
    case 'year-new':
        sortOrder = { year: -1, date: -1 }; // Recent years first
        break;
    case 'year-old':
        sortOrder = { year: 1, date: -1 };  // Oldest years first
        break;
    case 'name-asc':
        sortOrder = { name: 1 };            // Alphabetical A-Z
        break;
    default:
        sortOrder = { date: -1 };           // Default fallback
}

        // --- 4. EXECUTION ---
        // countDocuments(query) now accurately reflects the current tab (Active or Trash)
        const [products, total] = await Promise.all([
            productModel.find(query)
                .select('name price marketPrice image category country condition year blogLink stock date bestseller description youtubeUrl releaseDate isActive isLatest newArrival producedCount isFeatured')
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
            year, condition, country, stock, producedCount,releaseDate,
            bestseller, newArrival, imageName ,isFeatured
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
            isFeatured: isFeatured === "true", 
            newArrival: newArrival === "true", // New Field
            releaseDate: releaseDate || "",
            blogLink: csvBlogLink || "",
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

        // 1. Unified Permission List: Added 'isFeatured' to allowed fields
        const allowedFields = ['bestseller', 'newArrival', 'isActive', 'isLatest', 'isFeatured'];
        if (!allowedFields.includes(field)) {
            return res.json({ success: false, message: "Invalid attribute update protocol" });
        }

        // 2. Automated Category Sync: Logic for isActive updates
        if (field === 'isActive') {
            // Fetch affected specimens to calculate category deltas
            const affectedProducts = await productModel.find(
                { _id: { $in: ids } }, 
                'category isActive'
            ).lean();

            const categoryFreqMap = new Map();

            affectedProducts.forEach(p => {
                // Only count items where the status is actually changing
                if (p.isActive !== value && p.category) {
                    p.category.forEach(cat => {
                        categoryFreqMap.set(cat, (categoryFreqMap.get(cat) || 0) + 1);
                    });
                }
            });

            // Prepare High-Performance Bulk Write Operations
            const categoryOps = Array.from(categoryFreqMap).map(([name, count]) => ({
                updateOne: {
                    filter: { name },
                    // Increment if activating, decrement if deactivating
                    update: { $inc: { productCount: value ? count : -count } }
                }
            }));

            if (categoryOps.length > 0) {
                await categoryModel.bulkWrite(categoryOps);
            }
        }

        // 3. Registry Execution: Update all selected IDs in a single call
        const updateResult = await productModel.updateMany(
            { _id: { $in: ids } },
            { $set: { [field]: value } }
        );

        res.json({ 
            success: true, 
            message: `Registry updated: ${field} set to ${value} for ${updateResult.modifiedCount} specimens.` 
        });

    } catch (error) {
        console.error("Bulk Update Protocol Failure:", error);
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
        if (updateData.blogLink !== undefined) {
            // Trim whitespace to ensure the URL validator in the model doesn't trip on spaces
            updateData.blogLink = String(updateData.blogLink).trim();
        }
        
        // --- DATABASE UPDATE ---
        // const updatedProduct = await productModel.findByIdAndUpdate(
        //     id, 
        //     { $set: updateData }, 
        //     { new: true, runValidators: true } // runValidators ensures the URL format is checked
        // );
        
        if (updateData.stock !== undefined) {
            updateData.stock = Number(updateData.stock);
        }
        if (updateData.releaseDate) {
            // Trim whitespace to avoid regex validation errors
            updateData.releaseDate = updateData.releaseDate.trim();
            
            // Optional: Basic server-side check before hitting the DB validator
            const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
            if (!dateRegex.test(updateData.releaseDate)) {
                return res.json({ 
                    success: false, 
                    message: "Invalid date format. Please use DD/MM/YYYY." 
                });
            }
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
        ['bestseller', 'newArrival', 'isActive','isFeatured'].forEach(field => {
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

        // await sendUpdateEmails(products);

        res.json({ success: true, products });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};




export { 
    listProducts, addProduct, removeProduct, singleProduct, 
    updateProduct, removeBulkProducts, bulkAddProducts, uploadMedia, listMedia ,singleProduct1,updateMediaName,deleteMedia
};