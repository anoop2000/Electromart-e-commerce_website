const express = require('express')
const router =  express.Router()
const passport  = require('passport')
const userController = require('../controllers/user/userController')
const { userAuth } = require('../middlewares/auth')
const {blockUserCheck} = require('../middlewares/auth')
const {errorHandler} =  require('../middlewares/auth')
const productController = require('../controllers/user/productController')
const profileController = require('../controllers/user/profileController')
const cartController = require('../controllers/user/cartController')
const orderController = require('../controllers/user/orderController')
const wishlistController = require('../controllers/user/wishlistController')

const Cart  = require('../models/cartSchema')
const User = require('../models/userSchema')

router.get('/pageNotFound',userController.pageNotFound)
router.get('/aboutUs',userController.aboutUs)

router.get('/signup',userController.loadSignup)
router.post('/signup',userController.signup)

router.post('/verify-otp',userController.verifyOtp)
router.post('/resend-otp',userController.resendOtp)

router.get('/auth/google',passport.authenticate('google',{scope: ['profile','email']}))

router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
    res.redirect('/')
})

//login management
router.get('/login',userController.loadLogin)
router.post('/login',userController.login)
router.get('/logout',userController.logout);


//product-details page
router.get('/product-details',blockUserCheck,userAuth,productController.productDetails)

//home page & shopping page
router.get('/',userController.loadHomepage)
router.get('/shop',userAuth,userController.loadShoppingPage)
router.get('/filter',blockUserCheck,userAuth,userController.filterProduct)
router.get('/filterPrice',blockUserCheck,userAuth,userController.filterByPrice)
router.get('/search',blockUserCheck,userAuth,userController.searchProducts)
router.get('/sortByPrice', blockUserCheck,userAuth,userController.sortPrice);
router.get('/sortByAlpha',blockUserCheck,userAuth,userController.sortByAlpha)
router.get('/clearFilters',blockUserCheck,userAuth,userController.clearFilters)

//profile management
router.get('/forgot-password',profileController.getForgotPassPage)
router.post('/forgot-email-valid',profileController.forgotEmailValid)
router.post('/verify-passForgot-otp',profileController.verifyForgotPassOtp)
router.get('/reset-password',profileController.getResetPassPage)
router.post('/resend-forgot-otp',profileController.resendOtp)
router.post('/reset-password',profileController.postNewPassword)

//
router.get('/change-email',blockUserCheck,userAuth,profileController.changeEmail)
router.post('/change-email',blockUserCheck,userAuth,profileController.changeEmailValid)
router.post('/verify-email-otp',blockUserCheck,userAuth,profileController.verifyEmailOtp)
router.post('/update-email',blockUserCheck,userAuth,profileController.updateEmail)
router.get('/change-password',blockUserCheck,userAuth,profileController.changePassword)
router.post('/change-password',blockUserCheck,userAuth,profileController.changePasswordValid)
router.get('/verify-changepassword-otp',blockUserCheck,userAuth,profileController.getchangePassOtp)
router.post('/verify-changepassword-otp',blockUserCheck,userAuth,profileController.verifyChangePassOtp)
router.get('/userProfile',blockUserCheck,userAuth,profileController.userProfile)
router.get('/editProfile',blockUserCheck,userAuth,profileController.getEditProfile)
router.post('/updateProfile',blockUserCheck,userAuth,profileController.updateProfile)

router.get('/downloadInvoice/:id',blockUserCheck,userAuth,profileController.invoiceDownload)


//order management

router.get('/orders',userAuth,blockUserCheck,orderController.ordersList)
//router.get('/viewDetails',userAuth,orderController.viewDetails)
router.get('/orderStatusPage/:id',blockUserCheck,userAuth, orderController.orderStatusPage);
router.post('/cancelOrder/:id',blockUserCheck, userAuth, orderController.cancelOrder);
router.post('/returnOrder/:id',blockUserCheck,userAuth,orderController.returnOrder)






//Address management
router.get('/addAddress',blockUserCheck,userAuth,profileController.addAddress)
router.post('/addAddress',blockUserCheck,userAuth,profileController.postAddAddress)
router.get('/edit-address',blockUserCheck,userAuth,profileController.editAddress)
router.post('/edit-address',blockUserCheck,userAuth,profileController.postEditAddress)
router.get('/deleteAddress',blockUserCheck,userAuth,profileController.deleteAddress)


//cart management
router.get('/getCart',blockUserCheck,userAuth,cartController.renderCartPage)
router.post('/addToCart', blockUserCheck,userAuth, cartController.addToCart);

router.get('/removeFromCart',blockUserCheck,userAuth,cartController.deleteFromCart)
router.put('/getCart/decQty/:id',blockUserCheck,userAuth,cartController.decQty)
router.put('/getCart/incQty/:id',blockUserCheck,userAuth,cartController.incQty)

//checkout management
router.get('/checkout',blockUserCheck,userAuth,cartController.checkOutPage)
router.post('/checkout/editAddress',blockUserCheck,userAuth,cartController.updateAddress)
router.post('/checkout/deleteAddress',blockUserCheck,userAuth,cartController.deleteAddress)
router.post('/confirm-address',blockUserCheck,userAuth,cartController.confirmAddress)
router.post('/selectPaymentType',blockUserCheck,userAuth,cartController.selectPaymentType)
router.get('/orderSuccess',blockUserCheck,userAuth,cartController.orderPlaced)

router.post('/checkout/applyCoupon',blockUserCheck,userAuth,cartController.applyCoupon)
router.post('/checkout/removeCoupon',blockUserCheck,userAuth,cartController.removeCoupon)

router.post('/create-razorpay-order',blockUserCheck, userAuth, cartController.createRazorpayOrder);
router.post('/verify-payment',blockUserCheck, userAuth, cartController.verifyPayment);
router.get('/checkout/processPayment',userAuth,cartController.processWalletPayment);
router.get('/orderSuccessRzpy',blockUserCheck,userAuth,cartController.orderPlacedRzpy)

//wishlist management
router.get('/wishlist',blockUserCheck,userAuth,wishlistController.loadwishlist);
router.post('/toggleWishlist',blockUserCheck,userAuth,wishlistController.toggleWishlist)
router.get('/removeFromWishlist',blockUserCheck,userAuth,wishlistController.removeProduct)
router.post('/moveToCart/:id',blockUserCheck,userAuth,wishlistController.moveToCart)


// router.get('/example-error', (req, res, next) => {
//     try {
//         // Simulating an error
//         throw new Error("This is an example error!");
//     } catch (err) {
//         next(err); // Passing the error to the error-handling middleware
//     }
// });

router.get('/get-counts', async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) {
            return res.json({ cartCount: 0, wishlistCount: 0 });
        }

        const cart = await Cart.findOne({ userid : userId });
        const user = await User.findById(userId);

        res.json({
            cartCount: cart ? cart.items.length : 0,
            wishlistCount: user ? user.wishlist.length : 0
        });
    } catch (error) {
        console.error('Error getting counts:', error);
        res.json({ cartCount: 0, wishlistCount: 0 });
    }
});






module.exports = router;



