import express from 'express'
import { 
    listProducts, 
    addProduct, 
    removeProduct, 
    singleProduct, 
    uploadSingleImage,
    updateProductImages,
    updateProduct,
    removeBulkProducts,
    uploadMedia,
    bulkAddProducts,listMedia, // Use the new matching logic
    singleProduct1,
    deleteMedia,
    updateMediaName,
    bulkUpdateStatus,
    bulkUpdateAttributes,
    getRecentlyUpdated,
    listProductsForAdminEdit
} from '../controllers/productController.js'
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';
import { chatWithRegistry } from '../controllers/chatController.js';

const productRouter = express.Router();

// --- BULK OPERATIONS ---
// Replaced bulkAddStamps with bulkAddProducts to support Media Registry matching
productRouter.post('/bulk-add', adminAuth, upload.single('file'), bulkAddProducts);
productRouter.post('/remove-bulk', adminAuth, removeBulkProducts);
productRouter.get('/list-media', adminAuth, listMedia);
// --- MEDIA REGISTRY ---
// Dedicated endpoint to upload and map image filenames before CSV processing
productRouter.post('/upload-media', adminAuth, upload.single('image'), uploadMedia);
productRouter.post('/upload-single', adminAuth, upload.fields([{ name: 'image1', maxCount: 1 }]), uploadSingleImage);

// --- PRODUCT MANAGEMENT ---
productRouter.post('/add', adminAuth, upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
]), addProduct);

productRouter.post('/update', adminAuth, updateProduct);
productRouter.post('/update-images', adminAuth, upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 }
]), updateProductImages);

productRouter.post('/remove', adminAuth, removeProduct);
productRouter.post('/single', singleProduct);
productRouter.get('/list', listProducts);
productRouter.get('/single', singleProduct1);
// Route to update media filename
productRouter.post('/update-media-name', adminAuth, updateMediaName);

// Route for bulk/single deletion
productRouter.post('/delete-media', adminAuth, deleteMedia);
productRouter.post('/query', chatWithRegistry);
productRouter.post('/bulk-status', adminAuth, bulkUpdateStatus);
// Add this near your other routes
productRouter.get('/admin-list', adminAuth, listProductsForAdminEdit);


productRouter.post('/bulk-update-attributes', adminAuth, bulkUpdateAttributes);
productRouter.get('/latest-updates', getRecentlyUpdated);





export default productRouter;