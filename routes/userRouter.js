const express = require('express')
const router =  express.Router()
const passport  = require('passport')
const userController = require('../controllers/user/userController')
const { userAuth } = require('../middlewares/auth')
const productController = require('../controllers/user/productController')
const profileController = require('../controllers/user/profileController')
const cartController = require('../controllers/user/cartController')
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
router.get('/product-details',userAuth,productController.productDetails)

//home page & shopping page
router.get('/',userController.loadHomepage)
router.get('/shop',userAuth,userController.loadShoppingPage)
router.get('/filter',userAuth,userController.filterProduct)
router.get('/filterPrice',userAuth,userController.filterByPrice)
router.post('/search',userAuth,userController.searchProducts)
router.get('/sortByPrice', userAuth,userController.sortPrice);
router.get('/sortByAlpha',userAuth,userController.sortByAlpha)

//profile management
router.get('/forgot-password',profileController.getForgotPassPage)
router.post('/forgot-email-valid',profileController.forgotEmailValid)
router.post('/verify-passForgot-otp',profileController.verifyForgotPassOtp)
router.get('/reset-password',profileController.getResetPassPage)
router.post('/resend-forgot-otp',profileController.resendOtp)
router.post('/reset-password',profileController.postNewPassword)
router.get('/change-email',userAuth,profileController.changeEmail)
router.post('/change-email',userAuth,profileController.changeEmailValid)
router.post('/verify-email-otp',userAuth,profileController.verifyEmailOtp)
router.post('/update-email',userAuth,profileController.updateEmail)
router.get('/change-password',userAuth,profileController.changePassword)
router.post('/change-password',userAuth,profileController.changePasswordValid)
router.post('/verify-changepassword-otp',userAuth,profileController.verifyChangePassOtp)



router.get('/userProfile',userAuth,profileController.userProfile)

//Address management
router.get('/addAddress',userAuth,profileController.addAddress)
router.post('/addAddress',userAuth,profileController.postAddAddress)
router.get('/edit-address',userAuth,profileController.editAddress)
router.post('/edit-address',userAuth,profileController.postEditAddress)
router.get('/deleteAddress',userAuth,profileController.deleteAddress)


//cart management
router.get('/getCart',userAuth,cartController.renderCartPage)
router.get('/addToCart',userAuth,cartController.addToCart)
router.get('/removeFromCart',userAuth,cartController.deleteFromCart)
router.put('/getCart/decQty/:id',userAuth,cartController.decQty)
router.put('/getCart/incQty/:id',userAuth,cartController.incQty)

//checkout management
router.get('/checkout',userAuth,cartController.checkOutPage)
router.post('/checkout/editAddress',userAuth,cartController,updateAddress)





module.exports = router;



