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

const resetCategoryPrices = async (categoryIds) => {
  const products = await Product.find({ category: { $in: categoryIds } });
  await resetProductPrices(products.map((p) => p._id));
};

const checkActiveOffers = async (product) => {
  const now = new Date();

  // Check product-specific offers
  const productOffer = await Offer.findOne({
    offerType: "product",
    items: product._id,
    startDate: { $lte: now },
    endDate: { $gte: now },
    isActive: true,
  });

  // Check category offers
  const categoryOffer = await Offer.findOne({
    offerType: "category",
    items: product.category,
    startDate: { $lte: now },
    endDate: { $gte: now },
    isActive: true,
  });

  // Return the offer with higher discount if both exist
  if (productOffer && categoryOffer) {
    return productOffer.discountPercentage > categoryOffer.discountPercentage
      ? productOffer
      : categoryOffer;
  }

  return productOffer || categoryOffer || null;
};

const checkExpiredOffers = async () => {
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
  
  // Schedule the task to run every minute
  setInterval(checkExpiredOffers, 60000);

module.exports = {
  resetCategoryPrices,
  resetProductPrices,
  updateOfferStatus,
  updateCategoryPrices,
  updateProductPrices,
  checkActiveOffers,
  checkExpiredOffers
};
