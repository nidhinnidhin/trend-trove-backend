const mongoose = require('mongoose');

const SizeVariantSchema = new mongoose.Schema(
  {
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
    size: { type: String, required: true },  
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    inStock: { type: Boolean, default: true }, 
    stockCount: { type: Number, required: true, min: 0 },
    description: { type: String }, 
  },
  { timestamps: true }
);

// Add a pre-save hook to update inStock based on stockCount
SizeVariantSchema.pre('save', function(next) {
  this.inStock = this.stockCount > 0;
  next();
});

const SizeVariant = mongoose.model('SizeVariant', SizeVariantSchema);
module.exports = SizeVariant;







