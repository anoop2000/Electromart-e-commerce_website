const User = require('../../models/userSchema')
const Product = require('../../models/productSchema')
const Cart = require('../../models/cartSchema')
const Wishlist  = require('../../models/wishlistSchema')
const mongoose  = require('mongoose')




const loadwishlist= async(req,res)=>{
    try {

        const userId =req.session.user;
        const user = await User.findById(userId);
        const products = await Product.find({_id : {$in : user.wishlist}}).populate('category');

        res.render('wishlist',{
            user,
            wishlist : products,
            
        })
        
    } catch (error) {
        console.log(error);
        res.redirect('/pageNotFound')        

        
    }
}










const toggleWishlist = async (req, res) => {
    try {
        const productId = req.body.productId;
        const userId = req.session.user;

        // Ensure productId is valid
        if (!productId) {
            return res.status(400).json({ status: false, message: "Invalid product ID" });
        }

        // Fetch the user document
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
        }

        // Check if product is in user's wishlist
        const productIndex = user.wishlist.indexOf(productId);

        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            wishlist = new Wishlist({
                userId,
                products: [],
            });
        }
        let wishlistCount;

        if (productIndex === -1) {
            // Add product to user's wishlist and wishlist collection
            user.wishlist.push(productId);
            wishlist.products.push({ productId });
            wishlistCount +=  wishlist.length
             
        } else {
            // Remove product from user's wishlist and wishlist collection
            user.wishlist.splice(productIndex, 1);
            wishlist.products = wishlist.products.filter(
                (p) => p.productId.toString() !== productId
                
            );
            wishlistCount +=  wishlist.length
        }

        // Filter out null values from wishlist
        user.wishlist = user.wishlist.filter(Boolean);

        await user.save();
        await wishlist.save();

        return res.status(200).json({
            status: true,
            added: productIndex === -1,
            message: productIndex === -1
                ? "Product added to wishlist"
                : "Product removed from wishlist",
        });
    } catch (error) {
        console.error("Error in toggleWishlist:", error);
        return res.status(500).json({ status: false, message: "Server error" });
    }
};














const removeProduct = async (req, res) => {
    try {
        const productId = req.query.productId;
        const userId = req.session.user;
        const user = await User.findById(userId);
      
        const index = user.wishlist.indexOf(productId);
        user.wishlist.splice(index, 1);

        
        const wishlist = await Wishlist.findOne({ userId });
        if (wishlist) {
            // Use the pull method on the products array
            wishlist.products = wishlist.products.filter(
                (item) => item.productId.toString() !== productId
            );
            await wishlist.save(); // Save the updated wishlist document
        }

        await user.save();
        return res.redirect('/wishlist');
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: 'Server error' });
    }
};







const moveToCart = async (req, res) => {
    try {
        const userId = req.session.user._id; // Get user ID from session
        const productId = req.params.id; // Get product ID from request params

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not logged in" });
        }

        // Fetch the user's wishlist
        const wishlist = await Wishlist.findOne({ userId }).lean();
        if (!wishlist || !wishlist.products.some(p => p.productId.toString() === productId)) {
            return res.status(404).json({ success: false, message: "Product not found in wishlist" });
        }

        // Fetch product details
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Find or create the user's cart
        let cart = await Cart.findOne({ userid: userId });
        if (!cart) {
            cart = new Cart({
                userid: userId,
                items: [],
            });
        }

        // Check if the product is already in the cart
        const existingCartItem = cart.items.find(item =>
            item.productId.toString() === productId
        );

        if (existingCartItem) {
            // If the product is already in the cart, redirect to the cart page
            return res.status(200).json({
                success: true,
                message: "Product already in cart",
                redirectUrl: "/getCart",
            });
        }

        // Add the product as a new item
        const productPrice = product.salePrice || product.regularPrice;
        cart.items.push({
            productId: productId,
            quantity: 1,
            price: productPrice,
            totalPrice: productPrice,
        });

        // Save the updated cart
        await cart.save();

        // Update session with new cart count
        req.session.cartCount = cart.items.length;

        res.status(200).json({
            success: true,
            message: "Product moved to cart successfully",
            cartCount: cart.items.length,
        });
    } catch (error) {
        console.error("Error in moveToCart:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};














module.exports = {
    loadwishlist,
    toggleWishlist,
    removeProduct,
    moveToCart
}