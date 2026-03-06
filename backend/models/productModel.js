import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        trim: true,
        index: true 
    },
    description: { type: String, required: true },
    price: { 
        type: Number, 
        required: true, 
        index: true 
    },
    marketPrice: { type: Number, required: true },
    
    image: { 
        type: [String], 
        required: true,
        // validation cap removed to allow unlimited variants (BK04, BK04 (1), BK04 (2), etc.)
    },
    
    youtubeUrl: { 
        type: String, 
        default: "" // Cap/limit removed
    },
    
    category: { 
        type: [String], 
        required: true, 
        index: true 
    }, 
    year: { 
        type: Number, 
        required: true, 
        index: true 
    },
    // New: The total quantity ever produced for this specimen
    producedCount: { 
        type: Number, 
        default: 0 
    },
    condition: { 
        type: String, 
        required: true, 
        enum: ['Mint', 'Used', 'Fine', 'Near Mint'],
        index: true
    }, 
    country: { 
        type: String, 
        required: true, 
        index: true 
    },
    stock: { type: Number, required: true, default: 1 },
    soldCount: { type: Number, default: 0 },
    
    // Updated: Boolean flags for shop logic
    bestseller: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },

    newArrival: { type: Boolean, default: false, index: true }, 
    releaseDate: { 
        type: String, 
        required: true, 
        validate: {
            validator: function(v) {
                // Regex to enforce DD/MM/YYYY format
                return /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(v);
            },
            message: props => `${props.value} is not a valid date format! Use DD/MM/YYYY.`
        },
        index: true 
    },
    // Added newArrival

    date: { 
        type: Number, 
        required: true, 
        index: true 
    },
    rewardPoints: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { 
    timestamps: true 
});

// --- PERFORMANCE INDEXES ---
productSchema.index({ name: 'text', country: 'text', category: 'text', description: 'text' });
productSchema.index({ category: 1, date: -1 });
productSchema.index({ price: 1, date: -1 });
productSchema.index({ name: 1, date: -1 });
productSchema.index({ newArrival: 1, date: -1 }); // Optimized for "New Arrivals" section

// --- AUTOMATED LOGIC ---
productSchema.pre('save', function(next) {
    // Automatically set reward points to 10% of price
    this.rewardPoints = Math.floor(this.price * 0.10); 
    next();
});

const productModel = mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;