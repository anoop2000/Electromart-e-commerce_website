const Product = require('../../models/productSchema')
const Category = require('../../models/categorySchema')
const User  =  require('../../models/userSchema')
const Cart  = require('../../models/cartSchema')


//----------------------------------------------------------------



const productDetails = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);

        const productId = req.query.id;
        const product = await Product.findById(productId).populate('category');//populate the category
        const findCategory = product.category;

        const categoryOffer = findCategory?.categoryOffer || 0;
        const productOffer = product.productOffer || 0;
        const totalOffer = Number(categoryOffer) + Number(productOffer);

        let isInCart = false;
        if (userId) {
            const cartItem = await Cart.findOne({
                userid: userId,
                'items.productId': productId
            });
            isInCart = cartItem ? true : false;
        }
        

        // Fetch related products based on the category
        const relatedProducts = await Product.find({
            category: findCategory, // Match the same category
            _id: { $ne: productId }    // Exclude the current product
        }).limit(4); // Limit the number of related products

        res.render('product-details', {
            user: userData,
            product: product,
            quantity: product.quantity,
            totalOffer: totalOffer,
            category: findCategory,
            relatedProducts: relatedProducts, // Pass related products to the view
            isInCart 
        });

    } catch (error) {
        console.error("Error fetching product details:", error);
        res.redirect('/pageNotFound');
    }
};






module.exports= {
    productDetails,
    
}