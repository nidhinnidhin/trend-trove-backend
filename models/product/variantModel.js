// const mongoose = require('mongoose');

// const VariantSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     description: { type: String, required: true }, // Optional: Use if variants need unique descriptions
//     price: { type: Number, required: true },
//     discountPrice: { type: Number },
//     size: { type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], required: true }, // Single size
//     color: { type: String, required: true }, // Single color
//     material: { type: String },
//     pattern: { type: String },
//     inStock: { 
//       type: String, 
//       enum: ['Available', 'Not Available'], 
//       required: true 
//     },
//     stockCount: { type: Number, required: true, default: 0 },
//     mainImage: { type: String, required: true }, // Each variant has its own main image
//     subImages: [{ type: String }], // Optional additional images for the variant
//   },
//   { timestamps: true }
// );

// const Variant = mongoose.model('Variant', VariantSchema);
// module.exports = Variant;

const mongoose = require('mongoose');

const VariantSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    color: { type: String, required: true }, 
    colorImage: { type: String, required: true },
    mainImage: { type: String, required: true },
    subImages: [{ type: String }], 
    sizes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SizeVariant' }], // Links to size variants
  },
  { timestamps: true }
);

const Variant = mongoose.model('Variant', VariantSchema);
module.exports = Variant;
