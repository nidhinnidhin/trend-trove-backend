
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
