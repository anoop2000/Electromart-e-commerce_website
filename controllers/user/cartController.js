const Cart = require('../../models/cartSchema')
const Product = require('../../models/productSchema')
const User = require('../../models/userSchema')
const Address = require('../../models/addressSchema')





// const getCartPage = async (req, res) => {
//     try {
//         // Retrieve the user ID from session
//         const userId = req.session.user;
//         if (!userId) {
//             return res.redirect('/login'); // Redirect to login if not logged in
//         }

//         // Fetch user data
//         const userData = await User.findById(userId);
//         if (!userData) {
//             return res.redirect('/login'); // Redirect to login if user does not exist
//         }

//         // Retrieve the product ID from query parameters
//         const productId = req.query.id;
//         if (!productId) {
//             return res.redirect('/shop'); // Redirect to shop if no product ID is provided
//         }

//         // Fetch product details
//         const product = await Product.findById(productId);
//         if (!product) {
//             return res.redirect('/shop'); // Redirect to shop if product does not exist
//         }

//         // Find or create the user's cart
//         let cartData = await Cart.findOne({ userid: userId }).populate('items.productId');
//         if (!cartData) {
//             cartData = new Cart({ userid: userId, items: [] });
//         }

//         // Check if the product is already in the cart
//         const existingItem = cartData.items.find(item => item.productId._id.toString() === productId);

//         if (existingItem) {
//             // Increment the quantity and update the total price
//             existingItem.quantity += 1;
//             existingItem.totalPrice = existingItem.quantity * product.salePrice;
//         } else {
//             // Add the product as a new item in the cart
//             cartData.items.push({
//                 productId: product._id,
//                 quantity: 1,
//                 price: product.salePrice,
//                 totalPrice: product.salePrice,
//             });
//         }

//         // Save the updated cart
//         await cartData.save();

//         // Recalculate the grand total
//         //const grandTotal = cartData.items.reduce((total, item) => total + item.totalPrice, 0);

//         // Render the cart page with updated data
//         res.render('addToCart', {
//             user: userData, // Pass the logged-in user's data
//             cartData: cartData.items, // Pass the cart items
//             //grandTotal: grandTotal, // Pass the grand total
//         });

//     } catch (error) {
//         console.error('Error in getCartPage:', error);
//         res.redirect('/pageNotFound'); // Redirect to a "Page Not Found" page on error
//     }
// };




const getCartPage = async (req, res) => {
    try {
        // Retrieve the user ID from the session
        const userId = req.session.user;
        if (!userId) {
            return res.redirect('/login'); // Redirect to login if not logged in
        }

        // Fetch user data
        const userData = await User.findById(userId);
        if (!userData) {
            return res.redirect('/login'); // Redirect to login if user does not exist
        }

        // Retrieve the product ID from query parameters
        const productId = req.query.id;
        if (!productId) {
            return res.redirect('/shop'); // Redirect to shop if no product ID is provided
        }

        // Fetch product details
        const product = await Product.findById(productId);
        if (!product) {
            return res.redirect('/shop'); // Redirect to shop if product does not exist
        }

        // Find or create the user's cart
        let cartData = await Cart.findOne({ userid: userId }).populate('items.productId');
        if (!cartData) {
            cartData = new Cart({ userid: userId, items: [] });
        }

        // Check if the product is already in the cart
        const existingItem = cartData.items.find(item => item.productId._id.toString() === productId);

        if (existingItem) {
            // Increment the quantity and update the total price
            existingItem.quantity += 1;
            existingItem.totalPrice = existingItem.quantity * product.salePrice;
        } else {
            // Add the product as a new item in the cart
            cartData.items.push({
                productId: product._id,
                quantity: 1,
                price: product.salePrice,
                totalPrice: product.salePrice,
            });
        }

        // Save the updated cart
        await cartData.save();

        // Ensure every item in cartData has a valid image
        cartData.items.forEach(item => {
            if (!item.productId.productImage || item.productId.productImage.length === 0) {
                item.productId.productImage = ['default-image.jpg']; // Set a default image
            }
        });

        // Render the cart page with updated data
        res.render('addToCart', {
            user: userData, // Pass the logged-in user's data
            cartData: cartData.items, // Pass the cart items
        });

    } catch (error) {
        console.error('Error in getCartPage:', error);
        res.redirect('/pageNotFound'); // Redirect to a "Page Not Found" page on error
    }
};














module.exports ={ 
    
    
    getCartPage,
    //addToCart
}



