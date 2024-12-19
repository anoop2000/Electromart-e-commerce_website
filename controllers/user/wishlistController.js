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
            wishlist : products
        })
        
    } catch (error) {
        console.log(error);
        res.redirect('/pageNotFound')        

        
    }
}



// const addToWishlist = async(req,res)=>{
//     try {

//         const productId = req.body.productId;
//         const userId = req.session.user;
//         const user = await User.findById(userId);

//         if(user.wishlist.includes(productId)){
//             return res.status(200).json({status :false, message : "Product already in wishlist"})

//         }

//         user.wishlist.push(productId)

//         await user.save();
//         return res.status(200).json({status : true, message : "Product added to wishlist"})
        
//     } catch (error) {

//         console.log(error);
//         return res.status(500).json({status : false, message :"Server error"})
        
        
//     }
// }





const addToWishlist = async (req, res) => {
    try {
        const productId = req.body.productId; // Product ID from request body
        const userId = req.session.user; // User ID from session

        // Fetch the user document
        const user = await User.findById(userId);

        // Check if the product is already in the user's wishlist
        if (user.wishlist.includes(productId)) {
            return res.status(200).json({
                status: false,
                message: "Product already in wishlist",
            });
        }

        // Add the product to the user's wishlist array
        user.wishlist.push(productId);
        await user.save();

        // Update the Wishlist collection
        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            // If no wishlist exists, create a new one
            wishlist = new Wishlist({
                userId,
                products: [{ productId }],
            });
        } else {
            // Add the product to the wishlist collection
            wishlist.products.push({ productId });
        }

        // Save the wishlist document
        await wishlist.save();

        return res.status(200).json({
            status: true,
            message: "Product added to wishlist",
        });
    } catch (error) {
        console.error("Error in addToWishlist:", error);
        return res.status(500).json({
            status: false,
            message: "Server error",
        });
    }
};






// const removeProduct = async(req,res)=>{

//     try {

//         const productId = req.query.productId;
//         const userId = req.session.user;
//         const user = await User.findById(userId);
//         const index = user.wishlist.indexOf(productId)
//         user.wishlist.splice(index,1);
//         await user.save()

//         return res.redirect('/wishlist?removed=true')
        
        

        
        
//     }catch(error){
//         console.error(error);
//         res.redirect('/pageNotFoound')
//     }

// }




const removeProduct = async (req, res) => {
    try {
        const productId = req.query.productId; // Product ID from query parameters
        const userId = req.session.user; // User ID from session

        // Remove the product from the user's wishlist array
        const user = await User.findById(userId);

        if (!user) {
            return res.redirect('/pageNotFound');
        }

        const index = user.wishlist.indexOf(productId);
        if (index > -1) {
            user.wishlist.splice(index, 1);
            await user.save();
        }

        // Remove the product from the Wishlist collection
        const wishlist = await Wishlist.findOne({ userId });

        if (wishlist) {
            wishlist.products = wishlist.products.filter(
                (item) => item.productId.toString() !== productId
            );
            await wishlist.save();
        }

        return res.redirect('/wishlist?removed=true');
    } catch (error) {
        console.error("Error in removeProduct:", error);
        res.redirect('/pageNotFound');
    }
};









const moveToCart = async (req, res) => {
    try {
        const userId = req.session.user._id; // Get user ID from session
        const productId = req.params.id; // Get product ID from request params

        console.log("userId :",userId);
        console.log("ProductId :",productId);
        
        


        if (!userId) {
            return res.status(401).json({ success: false, message: "User not logged in" });
        }

        // Fetch the user's wishlist
        const wishlist = await Wishlist.findOne({  userId :userId }).lean();

        console.log("wishlist :",wishlist);
        

        if (!wishlist || !wishlist.products.some(p => p.productId.toString() === productId)) {
            return res.status(404).json({ success: false, message: "Product not found in wishlist" });
        }

        // Fetch product details
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const productPrice = product.salePrice || product.regularPrice;

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
            // Increment the quantity and update the total price
            existingCartItem.quantity += 1;
            existingCartItem.totalPrice += productPrice;
        } else {
            // Add the product as a new item
            cart.items.push({
                productId: productId,
                quantity: 1,
                price: productPrice,
                totalPrice: productPrice,
            });
        }

        // Save the updated cart
        await cart.save();

        
        return res.status(200).json({ success: true, message: "Product moved to cart successfully" });
    } catch (error) {
        console.error("Error in moveToCart:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};














module.exports = {
    loadwishlist,
    addToWishlist,
    removeProduct,
    moveToCart
}