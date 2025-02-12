import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    url: {
        type: String, 
        requried: true, 
        unique: true
    },
    currency: {
        type: String,
        requried: true
    },
    image: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true
    },
    currentPrice: {
        type: Number,
        requried: true
    },
    originalPrice: {
        type: Number,
        required: true
    },
    priceHistory: [
        {
            price: {type: Number, required: true},
            date: {type: Date, default: Date.now}
        }
    ],
    lowestPrice: { type: Number },
    highestPrice: { type: Number },
    averagePrice: { type: Number },
    discountRate: { type: Number },
    description: { type: String },
    category: {type: String},
    stars: {type: Number},
    reviewsCount: {type: Number},
    isOutOfStock: {type: Boolean, default: false},
    users: [
        {email: { type: String, required: true}}
      ], default: [],
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;