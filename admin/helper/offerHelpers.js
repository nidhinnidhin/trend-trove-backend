const Offer = require("../../models/offers/offerModal");
const Product = require("../../models/product/productModel");


const updateOfferStatus = async () => {
  const currentDate = new Date();
  try {
    await Offer.updateMany(
      { endDate: { $lt: currentDate }, isActive: true },
      { $set: { isActive: false } }
    );

    await Offer.updateMany(
      {
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate },
        isActive: false,
      },
      { $set: { isActive: true } }
    );

    console.log("Offer statuses updated successfully");
  } catch (error) {
    console.error("Error updating offer statuses:", error);
  }
};

const checkExpiredOffers = async () => {
  const now = new Date();

  const expiredOffers = await Offer.find({
    endDate: { $lt: now },
    isActive: true,
  });

  for (const offer of expiredOffers) {
    offer.isActive = false;
    await offer.save();
  }
};

const checkActiveOffers = async (product) => {
  const currentDate = new Date();

  const activeProductOffer = await Offer.findOne({
    items: product._id,
    offerType: 'product',
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate },
    isActive: true,
  }).sort({ startDate: -1 });

  const activeCategoryOffer = await Offer.findOne({
    items: product.category,
    offerType: 'category',
    startDate: { $lte: currentDate },
    endDate: { $gte: currentDate },
    isActive: true,
  }).sort({ startDate: -1 });

  return activeProductOffer || activeCategoryOffer;
};

module.exports = {
  checkActiveOffers,
  updateOfferStatus,
  checkExpiredOffers,
};
