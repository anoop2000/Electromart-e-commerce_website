const User = require('../models/userSchema')
const Cart = require('../models/cartSchema')

const updateCounts = async (req, res, next) => {
    try {
        if (req.session.user) {
            const userId = req.session.user;

            // Get cart count
            const cart = await Cart.findOne({ userId });
            const cartCount = cart ? cart.items.length : 0;

            req.session.cartCount = cartCount;

            // Get wishlist count
            const user = await User.findById(userId);
            const wishlistCount = user ? user.wishlist.length : 0;

            // Make counts available to all views
            res.locals.cartCount = cartCount;
            res.locals.wishlistCount = wishlistCount;
        }
        next();
    } catch (error) {
        console.error('Error in count middleware:', error);
        next();
    }
};

module.exports = updateCounts;