const Offer = require("../../models/offers/offerModal");
const Product = require("../../models//product/productModel");
const Category = require("../../models/product/categoryModel");
const SizeVariant = require("../../models/product/sizesVariantModel");

const updateProductPrices = async (productIds, discountPercentage) => {
  const products = await Product.find({ _id: { $in: productIds } }).populate({
    path: "variants",
    populate: {
      path: "sizes",
      model: "SizeVariant",
    },
  });

  for (const product of products) {
    for (const variant of product.variants) {
      for (const size of variant.sizes) {
        const originalPrice = size.price;
        const discountAmount = (originalPrice * discountPercentage) / 100;
        const newDiscountPrice = Math.round(originalPrice - discountAmount);

        await SizeVariant.findByIdAndUpdate(size._id, {
          discountPrice: newDiscountPrice,
        });
      }
    }
  }
};

// Helper function to update category prices
const updateCategoryPrices = async (categoryIds, discountPercentage) => {
  const products = await Product.find({
    category: { $in: categoryIds },
  }).populate({
    path: "variants",
    populate: {
      path: "sizes",
      model: "SizeVariant",
    },
  });

  await updateProductPrices(
    products.map((p) => p._id),
    discountPercentage
  );
};

// Scheduled task to check and update offer status
const updateOfferStatus = async () => {
  const now = new Date();

  // Find expired offers
  const expiredOffers = await Offer.find({
    endDate: { $lt: now },
    isActive: true,
  });

  // Reset prices for expired offers
  for (const offer of expiredOffers) {
    if (offer.offerType === "product") {
      await resetProductPrices(offer.items);
    } else {
      await resetCategoryPrices(offer.items);
    }

    // Mark offer as inactive
    offer.isActive = false;
    await offer.save();
  }
};

// Helper function to reset product prices
const resetProductPrices = async (productIds) => {
  await SizeVariant.updateMany(
    { variant: { $in: productIds } },
    { $set: { discountPrice: null } }
  );
};

// Helper function to reset category prices
const resetCategoryPrices = async (categoryIds) => {
  const products = await Product.find({ category: { $in: categoryIds } });
  await resetProductPrices(products.map((p) => p._id));
};

module.exports = {resetCategoryPrices, resetProductPrices, updateOfferStatus,updateCategoryPrices, updateProductPrices}
