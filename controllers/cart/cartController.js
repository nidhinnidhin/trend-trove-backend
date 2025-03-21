const Cart = require("../../models/cart/cartModal");
const Product = require("../../models/product/productModel");
const Variant = require("../../models/product/variantModel");
const SizeVariant = require("../../models/product/sizesVariantModel");
const asyncHandler = require("express-async-handler");

const addToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, sizeVariantId, quantity } = req.body;

  if (!productId || !variantId || !sizeVariantId || !quantity) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const product = await Product.findById(productId);
    const variant = await Variant.findById(variantId);
    const sizeVariant = await SizeVariant.findById(sizeVariantId);

    if (!product || !variant || !sizeVariant) {
      return res
        .status(404)
        .json({ message: "Product, variant, or size variant not found" });
    }

    if (sizeVariant.stockCount <= 0) {
      return res
        .status(400)
        .json({ message: "Selected size variant is out of stock" });
    }

    const totalPrice = sizeVariant.price * quantity;

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({
        user: req.user.id,
        items: [],
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.variant.toString() === variantId &&
        item.sizeVariant.toString() === sizeVariantId
    );

    if (existingItemIndex !== -1) {
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].totalPrice =
        cart.items[existingItemIndex].quantity *
        cart.items[existingItemIndex].price;
    } else {
      cart.items.push({
        product: productId,
        variant: variantId,
        sizeVariant: sizeVariantId,
        quantity,
        price: sizeVariant.price,
        totalPrice: totalPrice,
      });
    }

    cart.totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.totalPrice,
      0
    );

    await cart.save();

    res.status(201).json({
      message: "Product added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
});

const getCart = async (req, res) => {
  const userId = req.user.id;

  try {
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: "items.product",
        select: "name description price category brand isDeleted",
      })
      .populate({
        path: "items.variant",
        select: "color colorImage mainImage subImages",
      })
      .populate({
        path: "items.sizeVariant",
        select: "size price discountPrice stockCount",
      });

    if (!cart || cart.length === 0) {
      return res.status(200).json({ message: "Cart is empty", cart: [] });
    }

    cart.items = cart.items.sort(
      (a, b) => new Date(b._id.getTimestamp()) - new Date(a._id.getTimestamp())
    );

    return res
      .status(200)
      .json({ message: "Cart retrieved successfully", cart });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const deleteProductFromCart = asyncHandler(async (req, res) => {
  const { productId, variantId, sizeVariantId } = req.body;

  if (!productId || !variantId || !sizeVariantId) {
    return res.status(400).json({
      message: "Product ID, Variant ID, and Size Variant ID are required",
    });
  }

  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.variant.toString() === variantId &&
        item.sizeVariant.toString() === sizeVariantId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cart.items.splice(itemIndex, 1);

    cart.totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.totalPrice,
      0
    );

    await cart.save();

    res.status(200).json({
      message: "Product removed from cart successfully",
      cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error removing product from cart",
      error: error.message,
    });
  }
});

const updateProductQuantity = asyncHandler(async (req, res) => {
  const { productId, variantId, sizeVariantId, quantity } = req.body;

  if (!productId || !variantId || !sizeVariantId || quantity === undefined) {
    return res.status(400).json({
      message:
        "Product ID, Variant ID, Size Variant ID, and Quantity are required",
    });
  }

  if (quantity > 4) {
    return res
      .status(400)
      .json({ message: "Maximum quantity for a product is 4" });
  }

  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }
    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.variant.toString() === variantId &&
        item.sizeVariant.toString() === sizeVariantId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].totalPrice =
      cart.items[itemIndex].quantity * cart.items[itemIndex].price;

    cart.totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    cart.totalPrice = cart.items.reduce(
      (acc, item) => acc + item.totalPrice,
      0
    );

    await cart.save();

    res.status(200).json({
      message: "Product quantity updated successfully",
      cart,
    });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    cart.totalItems = 0;
    cart.totalPrice = 0;

    await cart.save();

    res.status(200).json({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = {
  addToCart,
  getCart,
  deleteProductFromCart,
  updateProductQuantity,
  clearCart,
};
