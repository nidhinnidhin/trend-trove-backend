const express = require("express");
const { addOffer, getOffers, editOffer, deleteOffer, resetOffer, checkExpiredOffers } = require('../../controllers/offer/offerController')
const authMiddleware = require('../../middleware/adminAuthMiddleware')

const router = express.Router();

router.post("/add",authMiddleware, addOffer);
router.get("/list", authMiddleware, getOffers);
router.put("/edit/:id", authMiddleware, editOffer);
router.delete("/delete/:id", authMiddleware, deleteOffer);
router.post("/reset/:id", authMiddleware, resetOffer);
router.post("/check-expired", authMiddleware, checkExpiredOffers);

module.exports = router;
