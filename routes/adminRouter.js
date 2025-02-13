const express = require('express')
const router = express.Router();
const adminController = require('../controllers/admin/adminController')
const customerController = require('../controllers/admin/customerController')
const categoryController = require('../controllers/admin/categoryController')
const brandController = require('../controllers/admin/brandController')
const productController = require('../controllers/admin/productController')
const orderDetailsController = require('../controllers/admin/orderDetailsController')
const couponController = require('../controllers/admin/couponController')
const salesController = require('../controllers/admin/salesController')
const bannerController = require('../controllers/admin/bannerController')
const {userAuth,adminAuth} = require('../middlewares/auth') 
const multer = require('multer')
const storage = require('../helpers/multer')
const uploads  = multer({storage:storage});


//error management
router.get('/pageerror',adminController.pageerror)

//login management
router.get('/login',adminController.loadLogin)
router.post('/login',adminController.login)
router.get('/',adminAuth,adminController.loadDashboard)
router.get('/logout',adminController.logout)

//customer management
router.get('/users',adminAuth,customerController.customerInfo)
router.get('/blockCustomer',adminAuth,customerController.customerBlocked)
router.get('/unblockCustomer',adminAuth,customerController.customerUnBlocked)

//category management
router.get('/category',adminAuth,categoryController.categoryInfo)
router.post('/addCategory',adminAuth,categoryController.addCategory)
router.post('/addCategoryOffer',adminAuth,categoryController.addCategoryOffer);
router.post('/removeCategoryOffer',adminAuth,categoryController.removeCategoryOffer)
router.get('/listCategory',adminAuth,categoryController.getListCategory)
router.get('/unlistCategory',adminAuth,categoryController.getUnlistCategory)
router.get('/editCategory',adminAuth,categoryController.getEditCategory)
router.post('/editCategory/:id',adminAuth,categoryController.editCategory)
router.get('/checkCategoryExists',adminAuth,categoryController.checkCategoryExists)

//Brand management
router.get('/brands',adminAuth,brandController.getBrandPage)
router.post('/addBrand',adminAuth,uploads.single('image'),brandController.addBrand)
router.get('/blockBrand',adminAuth,brandController.blockBrand)
router.get('/unBlockBrand',adminAuth,brandController.unBlockBrand)
router.post('/deleteBrand',adminAuth,brandController.deleteBrand)



//Product management
router.get('/addProducts',adminAuth,productController.getProductAddPage)
router.post('/addProducts',adminAuth,uploads.array('images',4),productController.addProducts)
router.get('/products',adminAuth,productController.getAllProducts)
router.post('/addProductOffer',adminAuth,productController.addProductOffer)
router.post('/removeProductOffer',adminAuth,productController.removeProductOffer)
router.get('/blockProduct',adminAuth,productController.blockProduct)
router.get('/unblockProduct',adminAuth,productController.unblockProduct)
router.get('/editProduct',adminAuth,productController.getEditProduct)
router.post('/editProduct/:id',adminAuth,uploads.array('images',4),productController.editProduct);
router.post('/deleteImage',adminAuth,productController.deleteSingleImage)


//order management
router.get('/orderList',adminAuth,orderDetailsController.orderList)
router.get('/orderList/orderStatus/:id',orderDetailsController.orderStatus)
router.get('/orderList/pending/:id',adminAuth,orderDetailsController.changeStatusPending)
router.get('/orderList/shipped/:id',adminAuth,orderDetailsController.changeStatusShipped)
router.get('/orderList/delivered/:id',adminAuth,orderDetailsController.changeStatusDelivered)
router.get('/orderList/return/:id',adminAuth,orderDetailsController.changeStatusReturn)
router.get('/orderList/cancelled/:id',adminAuth,orderDetailsController.changeStatusCancelled)


//coupon management

router.get('/coupon',adminAuth,couponController.loadCoupon)
router.post('/createCoupon',adminAuth,couponController.createCoupon)
router.get('/editCoupon',adminAuth,couponController.editCoupon)
router.post('/updatecoupon',adminAuth,couponController.updateCoupon)
router.get('/deletecoupon',adminAuth,couponController.deleteCoupon)


//sales report
router.get('/generate-sales-report',adminAuth,salesController.getReport);
router.post('/generate-sales-report',adminAuth,salesController.generateSalesReport)


//dashboard
router.get('/sales-data', adminAuth, adminController.getDashboard);
router.get('/dashboard',adminAuth,adminController.loadDashboard);


//banner management
router.get('/banner',adminAuth,bannerController.getBannerPage)
router.get('/addBanner',adminAuth,bannerController.getAddBannerPage)
router.post('/addBanner',adminAuth,uploads.single("images"),bannerController.addBanner)
router.get('/deleteBanner',adminAuth,bannerController.deleteBanner)



module.exports = router
