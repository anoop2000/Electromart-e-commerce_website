const express = require('express')
const router =  express.Router()
const passport  = require('passport')
const userController = require('../controllers/user/userController')
const { userAuth } = require('../middlewares/auth')
const productController = require('../controllers/user/productController')

router.get('/pageNotFound',userController.pageNotFound)
router.get('/',userController.loadHomepage)

router.get('/signup',userController.loadSignup)
router.post('/signup',userController.signup)
router.get('/shop',userController.loadShopping)
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






module.exports = router;



