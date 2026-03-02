import categoryModel from '../models/categoryModel.js';
import productModel from '../models/productModel.js'; // Import product model for sync

// 1. ADD CATEGORY
// 1. ADD CATEGORY
const addCategory = async (req, res) => {
    try {
        const { name, group, featured, image } = req.body; 
        const category = new categoryModel({ 
            name: name.trim(), 
            group: group?.trim() || 'Independent',
            productCount: 0,
            featured: featured || false,
            image: image || "" // Store admin-defined image URL
        });
        await category.save();
        res.json({ success: true, message: "Category Registered" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 3. UPDATE (Support for ID, Name, Featured, and Image)
const updateCategory = async (req, res) => {
    try {
        const { id, name, group, featured, image } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (group) updateData.group = group;
        if (featured !== undefined) updateData.featured = featured;
        if (image !== undefined) updateData.image = image; // Update the image field

        if (id) {
            await categoryModel.findByIdAndUpdate(id, updateData);
        } else if (name) {
            await categoryModel.findOneAndUpdate({ name: name }, updateData);
        } else {
            return res.json({ success: false, message: "Identification (ID or Name) required" });
        }

        res.json({ success: true, message: "Architecture Updated" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 2. LIST ALL
const listCategories = async (req, res) => {
    try {
        // Sort by featured first, then group, then name
        const categories = await categoryModel.find({}).sort({ featured: -1, group: 1, name: 1 });
        res.json({ success: true, categories });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 3. UPDATE (Support for ID, Name, and Featured status)
// const updateCategory = async (req, res) => {
//     try {
//         const { id, name, group, featured } = req.body; // Extract new fields

//         if (id) {
//             // Standard update by ID, including featured status
//             await categoryModel.findByIdAndUpdate(id, { name, group, featured });
//         } else if (name) {
//             // Sync update by Name - used for toggling featured status in Admin UI
//             await categoryModel.findOneAndUpdate({ name: name }, { group: group, featured: featured });
//         } else {
//             return res.json({ success: false, message: "Identification (ID or Name) required" });
//         }

//         res.json({ success: true, message: "Architecture Updated" });
//     } catch (error) {
//         res.json({ success: false, message: error.message });
//     }
// }

// 4. REMOVE
const removeCategory = async (req, res) => {
    try {
        await categoryModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Category Purged" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

// 5. RESET ALL COUNTS (Run this before your CSV upload)
const resetCategoryCounts = async (req, res) => {
    try {
        await categoryModel.updateMany({}, { $set: { productCount: 0 } });
        res.json({ success: true, message: "All Registry counts reset to zero. Ready for CSV upload." });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export { addCategory, listCategories, removeCategory, updateCategory, resetCategoryCounts };