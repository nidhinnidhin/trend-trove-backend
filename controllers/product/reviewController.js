// const Product = require('../../models/product/productModel');
// const asyncHandler = require('express-async-handler');

// // Add a review to a product
// const addReview = asyncHandler(async (req, res) => {
    
//     try {
//         const { productId } = req.params;
//         const { rating, comment } = req.body;
//         const userId = req.user._id; // Assuming you use authentication middleware
//         console.log('user',req.user._id);
        
//         console.log('user');
//     // Find the product
//     const product = await Product.findById(productId);

//     if (!product) {
//       return res.status(404).json({ message: 'Product not found.' });
//     }

//     // Check if the user has already reviewed the product
//     const alreadyReviewed = product.reviews.some(
//       (review) => review.user.toString() === userId.toString()
//     );

//     if (alreadyReviewed) {
//       return res.status(400).json({ message: 'You have already reviewed this product.' });
//     }

//     // Create the new review
//     const review = {
//       user: userId,
//       rating,
//       comment,
//     };

//     // Add the review and update review count and average rating
//     product.reviews.push(review);
//     product.reviewCount = product.reviews.length;
//     product.averageRating =
//       product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length;

//     // Save the updated product
//     await product.save();

//     // Send success response
//     res.status(201).json({ message: 'Review added successfully.', reviews: product.reviews });
//   } catch (error) {
//     res.status(500).json({ message: 'Error adding review.', error: error.message });
//   }
// });

// module.exports = { addReview };
