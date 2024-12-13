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
router.post('/search',blockUserCheck,userAuth,userController.searchProducts)
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
router.post('/verify-changepassword-otp',blockUserCheck,userAuth,profileController.verifyChangePassOtp)
router.get('/userProfile',blockUserCheck,userAuth,profileController.userProfile)
router.get('/editProfile',blockUserCheck,userAuth,profileController.getEditProfile)
router.post('/updateProfile',blockUserCheck,userAuth,profileController.updateProfile)


//order management

router.get('/orders',userAuth,orderController.ordersList)
router.get('/viewDetails',userAuth,orderController.viewDetails)
router.put('/cancelOrder/:id', userAuth, orderController.cancelOrder);







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

// router.get('/test-error', (req, res, next) => {
//     const error = new Error("This is a test error!");
//     error.status = 400; // Set a specific status code if desired
//     next(error); // Pass the error to the next middleware (error handler)
// });






module.exports = router;



