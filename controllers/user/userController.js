
const User = require("../../models/userSchema");
const Category  = require('../../models/categorySchema')
const Product = require('../../models/productSchema')
const Banner = require('../../models/bannerSchema')
const Brand = require('../../models/brandSchema')
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require('bcrypt');
const Wishlist = require('../../models/wishlistSchema')
const Wallet = require('../../models/walletSchema')

function generateReferralCode() {
  return 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();  // Random code
}

const pageNotFound = async (req,res)=>{
  try{
    res.render("page-404")
  }catch(error){
    res.redirect("/pageNotFound")
  }
}


const aboutUs = (req, res) => {
  try {
      res.render('aboutUs', {
          title: 'About Us',
          description: 'Learn more about our company, mission, and values.',
      });
  } catch (error) {
      console.error("Error rendering about page:", error);
      res.redirect('/pageerror'); // Redirect to an error page if needed
  }
};





const loadHomepage = async (req,res) => {
  try{
      const today = new Date().toISOString();
      const findBanner = await Banner.find({
        startDate :{$lt: new Date(today)},
        endDate : {$gt : new Date(today)},
      })
    const user = req.session.user
    
    const categories = await Category.find({ isListed: true });
    const categoryIds = categories.map(category => category._id);
    let productData = await Product.find({
      isBlocked :false,
      category: { $in: categoryIds },
                                                          // category : {$in : categories.map(category=> category._id)},
      quantity : {$gt:0}
    })
                                                         //console.log("Products Before Slice:", productData);



    productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));




    //productData = productData.slice(0,4)

                                                        //console.log("Products After Slice:", productData);
    

    if(user){

      const userData = await  User.findOne({_id:user._id})
      res.render('home',{user:userData, products :productData, banner : findBanner || []})
    }else{
      return res.render('home',{products :productData , banner : findBanner || []})
    }
    
    
  }catch(error){
    console.log("Home page not found",error);
    res.status(500).send("Server error");
  }
}





const loadSignup = async (req,res) => {
  try{
    return res.render("signup");
  }catch(error){
    console.log("Signup page not loading", error);
    res.status(500).send('Server Error');

  }
}





const loadShoppingPage = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });
    const categories = await Category.find({ isListed: true });
    const categoryIds = categories.map((category) => category._id.toString());
    

    //console.log("wishlist :",userWishlist);
    
    
    // Get query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const selectedCategory = req.query.category || '';
    const selectedBrand = req.query.brand || '';
    const sortBy = req.query.sortBy || '';
    const sortOrder = req.query.sortOrder || '';

    // Build base query
    let query = {
      isBlocked: false,
      category: { $in: categoryIds },
      quantity: { $gt: 0 },
    };

    // Add category filter if present
    if (selectedCategory) {
      query.category = selectedCategory;
    }

    // Add brand filter if present
    if (selectedBrand) {
      const brandDoc = await Brand.findById(selectedBrand);
      if (brandDoc) {
        query.brand = brandDoc.brandName;
      }
    }

    // Build sort options
    let sortOptions = {};
    if (sortBy === 'price') {
      sortOptions.salePrice = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'name') {
      sortOptions.productName = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Default sort
    }

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    let userWishlist = [];
        if (req.session.user) {
            const user = await User.findById(req.session.user);
            userWishlist = user ? user.wishlist : [];
        }

    // Get products with sorting and pagination
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    const brands = await Brand.find({ isBlocked: false });
    const categoriesWithIds = categories.map(category => ({
      _id: category._id,
      name: category.name
    }));

    res.render('shop', {
      user: userData,
      products: products,
      category: categoriesWithIds,
      brand: brands,
      totalProducts: totalProducts,
      currentPage: page,
      totalPages: totalPages,
      sortBy: sortBy,
      sortOrder: sortOrder,
      selectedCategory: selectedCategory,
      selectedBrand: selectedBrand,
      userWishlist 
    });

  } catch (error) {
    console.error('Error in loadShoppingPage:', error);
    res.redirect('/pageNotFound');
  }
};

/*------------------------------------------------------------------------------------*/

// const signup = async (req,res)=>{
//   const {name,email,phone,password,confirmPassword} = req.body;

  
  
//   try{


//     // Hash the password before saving it
//     const saltRounds = 10; // Number of salt rounds (higher means more secure but slower)
//     const hashedPassword = await bcrypt.hash(password, saltRounds);
    
       
//     const newUser = new User({
//       name,
//       email,
//       phone,
//       password : hashedPassword
//        // Save hashed password in the database
//     });

//       console.log(newUser);
      

//       await newUser.save();

//       return res.redirect("/signup")

//   }catch(error){

//      console.error("Error for save user",error) ;

//      res.status(500).send("Internal server error")

//   }
// }

//********************************************************************************************** */




function generateOtp() {
  let getOTP = Math.floor(100000 + Math.random() * 900000).toString();
  console.log("Generated OTP:", getOTP);
  return getOTP;
}

async function sendVerificationEmail(email, otp) {
  try {
      const transporter = nodemailer.createTransport({
          service: "gmail",
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
              user: process.env.NODEMAILER_EMAIL,
              pass: process.env.NODEMAILER_PASSWORD
          }
      });

      //console.log("Transporter created...");

      const info = await transporter.sendMail({
          from: process.env.NODEMAILER_EMAIL,
          to: email,
          subject: "Verify Your Account",
          text: `Your verification code is ${otp}`,
          html: `<b>Your OTP: ${otp}</b>`,
      });

      //console.log("Email sent:", info);
      return info.accepted.length > 0;

  } catch (error) {
      console.error("Error sending email", error);
      return false;
  }
}



const signup = async (req, res) => {
  try {
      const { name,phone,email, password, cPassword,referralCode } = req.body;

      
      // Check if user with this email already exists
      const findUser = await User.findOne({ email });
      if (findUser) {
          return res.render("signup", { message: "User with this email already exists" });
       }

      // Generate OTP
      const otp = generateOtp();
      console.log("Generated OTP:", otp);

      // Send OTP to the provided email
      const emailSent = await sendVerificationEmail(email, otp);
      if (!emailSent) {
          return res.render("signup", { message: "Failed to send OTP. Please try again." });
      }

      // Save OTP and user data in session for verification
      req.session.userOtp = otp;
      req.session.userData = { name,phone,email, password, referralCode };

      //console.log("OTP Sent:", otp);

      // Redirect to OTP verification page or render it
      res.render("verify-otp");

  } catch (error) {
      console.error("Error signing up", error);
      res.redirect("/pageNotFound");
  }
}

                  




  /*---------------------------------------------------------------------------------------------------------- */

    const securePassword = async(password)=>{
      try {
        
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash 

      } catch (error) {
        
      }
    } 




  const verifyOtp = async (req,res)=>{
    try {

      const {otp} = req.body

      

      if(otp === req.session.userOtp){
          const user = req.session.userData
          const passwordHash  = await securePassword(user.password) 

          const saveUserData = new User({
            name : user.name,
            email : user.email,
            phone : user.phone,
            password : passwordHash,
            referralCode: generateReferralCode(),  
            referredBy: user.referredBy || null
          })

          await saveUserData.save();
          //---------------------------------------------------------------------------------------------

          //console.log("Referral Code from user:", user.referralCode);

          if (user.referralCode) {
            const referrer = await User.findOne({ referralCode: user.referralCode });
            //console.log("referrer :",referrer);
            

            if (referrer) {
                // Credit Rs. 20 to the new user
                saveUserData.wallet += 20;

                // Credit Rs. 50 to the referrer
                referrer.wallet += 50;

                // Create wallet transactions for both users
                const walletTransactionForNewUser = new Wallet({
                    userId: saveUserData._id,
                    amount: 20,
                    status: 'Added',
                    description: 'Referral Bonus'
                });

                const walletTransactionForReferrer = new Wallet({
                    userId: referrer._id,
                    amount: 50,
                    status: 'Added',
                    description: 'Referral Bonus'
                });

                // Save wallet transactions
                await walletTransactionForNewUser.save();
                await walletTransactionForReferrer.save();

                // Update the walletHistory for both users
                saveUserData.walletHistory.push(walletTransactionForNewUser._id);
                referrer.walletHistory.push(walletTransactionForReferrer._id);

                // Save both users
                await referrer.save();
            }
        }



          //---------------------------------------------------------------------------------------------------

          await saveUserData.save();

          //req.session.user= saveUserData._id;

          req.session.user = null;

          res.json({success: true,redirectUrl :"/login"})


      }else{
        res.status(400).json({success: false, message :"Invalid OTP, Please try again"})
      }
      
    } catch (error) {
    console.error("Error verifying OTP", error);
    res.status(500).json({success :false,message: "An error occured"})
    
      
    }
  }


  const resendOtp = async(req,res)=>{
    try {
      const {email} = req.session.userData
      if(!email){
        return res.status(400),json({success:false ,message :"Email not found in session"})
        
      }

      const otp = generateOtp();
      req.session.userOtp = otp

      const emailSent = await sendVerificationEmail(email,otp)
      if(emailSent){
        //console.log("Resend OTP :",otp);
        res.status(200).json({success: true,message : "OTP Resend Successfully"})

        
      }else{
        res.status(500).json({success : false,message :"Failed to resend OTP,Please try again "})
      }
      

    } catch (error) {
      console.error("Error resending OTP",error);
      res.status(500).json({success:false,message :"Internal Server Error.Please try again"})
      
      
    }

  }


  /*-----------------------------------------------------------------------------------------------------*/


  const loadLogin = async (req,res)=>{

    try {
      if(!req.session.user){
        return res.render('login')
      }else{
        res.redirect('/')
      }
      
    } catch (error) {
      res.redirect('/pageNotFound')
      
    }

  }



  const login = async (req,res)=>{
    try {
      const {email,password} = req.body

      const findUser = await User.findOne({isAdmin:0,email:email});

      if(!findUser){
        return res.render('login',{message:"User not found"})
      }
      if(findUser.isBlocked){ //
        return res.render("login",{message :"User is blocked by Admin"})
      }


      // Compare passwords 
      const passwordMatch = await bcrypt.compare(password, findUser.password)
      
      // If password does not match
      if(!passwordMatch){
        return res.render('login',{message :"Incorrect Passowrd"})
      }


      // Store user ID or other necessary details in session
      req.session.user = {_id:findUser._id, name : findUser.name}
      res.redirect('/')
    } catch (error) {

      console.error('login error',error)
      res.render('login',{message :"Login failed,Please try again"})
      
    }
  }



  const logout=  async(req,res)=>{
    try {
      req.session.destroy((err)=>{
        if(err){
          console.log("Session destruction error",err.message);
          return res.redirect('/pageNotFound')
        }
        return res.redirect('/login')
      })
    } catch (error) {
      console.log("Logout error",error);
      res.redirect('/pageNotFound')
      
    }
  }



  



const filterProduct = async (req, res) => {
  try {
    const user = req.session.user;
    const category = req.query.category;
    const brand = req.query.brand;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;

    // Get sort parameters from query
    const sortBy = req.query.sortBy;
    const sortOrder = req.query.sortOrder;

    // Build base query
    let query = {
      isBlocked: false,
      quantity: { $gt: 0 },
    };

    // Add category filter if present
    if (category) {
      query.category = category;
    }

    // Add brand filter if present
    if (brand) {
      const brandDoc = await Brand.findById(brand);
      if (brandDoc) {
        query.brand = brandDoc.brandName;
      }
    }

    // Build sort options
    let sortOptions = {};
    if (sortBy === 'price') {
      sortOptions.salePrice = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'name') {
      sortOptions.productName = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Default sort
    }

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    // Get products with sorting and pagination
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    const categories = await Category.find({ isListed: true });
    const brands = await Brand.find({ isBlocked: false });


    let userWishlist = [];
        if (req.session.user) {
            const user = await User.findById(req.session.user);
            userWishlist = user ? user.wishlist : [];
        }


    // Store current filter state in session
    req.session.currentFilter = {
      category,
      brand,
      sortBy,
      sortOrder
    };

    res.render('shop', {
      user: await User.findOne({ _id: user }),
      products: products,
      category: categories,
      brand: brands,
      totalPages: totalPages,
      currentPage: page,
      sortBy: sortBy,
      sortOrder: sortOrder,
      selectedCategory: category,
      selectedBrand: brand,
      userWishlist
    });

  } catch (error) {
    console.error("Error in filterProduct:", error);
    res.redirect('/pageNotFound');
  }
};





const filterByPrice = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });

    // Get price range from query
    const minPrice = parseFloat(req.query.gt) || 0;
    const maxPrice = parseFloat(req.query.lt) || Infinity;

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = 6;

    // Build base query with price filter
    let query = {
      isBlocked: false,
      quantity: { $gt: 0 },
      salePrice: {
        $gt: minPrice,
        $lt: maxPrice,
      },
    };

    // Check if category and brand filters are explicitly provided
    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.brand) {
      const brandDoc = await Brand.findById(req.query.brand);
      if (brandDoc) {
        query.brand = brandDoc.brandName;
      }
    }

    // Build sort options
    let sortOptions = {};
    if (req.query.sortBy === 'price') {
      sortOptions.salePrice = req.query.sortOrder === 'desc' ? -1 : 1;
    } else if (req.query.sortBy === 'name') {
      sortOptions.productName = req.query.sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Default sort
    }

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    let userWishlist = [];
        if (req.session.user) {
            const user = await User.findById(req.session.user);
            userWishlist = user ? user.wishlist : [];
        }


    // Get products with sorting and pagination
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get categories and brands for sidebar
    const categories = await Category.find({ isListed: true }).lean();
    const brands = await Brand.find({ isBlocked: false }).lean();

    // Create price range text for user feedback
    let priceRangeText = '';
    if (maxPrice === 25000) {
      priceRangeText = 'Under ₹25,000';
    } else if (minPrice === 25000 && maxPrice === 50000) {
      priceRangeText = '₹25,000 - ₹50,000';
    } else if (minPrice === 50000 && maxPrice === 75000) {
      priceRangeText = '₹50,000 - ₹75,000';
    } else if (minPrice === 75000) {
      priceRangeText = 'Above ₹75,000';
    }

    return res.render('shop', {
      user: userData,
      products: products,
      category: categories,
      brand: brands,
      totalPages,
      currentPage: page,
      sortBy: req.query.sortBy || '',
      sortOrder: req.query.sortOrder || '',
      selectedCategory: req.query.category || '',
      selectedBrand: req.query.brand || '',
      priceRange: {
        min: minPrice,
        max: maxPrice,
        text: priceRangeText,
      },
      userWishlist
    });
  } catch (error) {
    console.error('Error in filterByPrice:', error);
    res.redirect('/pageNotFound');
  }
};







  const searchProducts = async (req, res) => {
    try {
      const user = req.session.user;
      const userData = await User.findOne({ _id: user });
      const searchQuery = req.query.search ? req.query.search.trim() : '';
  
      // If no search query, redirect to shop
      if (!searchQuery) {
        return res.redirect('/shop');
      }
  
      // Get pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = 6;

      // Get price range from query
    const minPrice = parseFloat(req.query.gt) || 0;
    const maxPrice = parseFloat(req.query.lt) || Infinity;
  
      // Get categories and brands for filtering
      const categories = await Category.find({ isListed: true });
      const brands = await Brand.find({ isBlocked: false });
  
      // Build base query for partial name match
      let query = {
        isBlocked: false,
        quantity: { $gt: 0 },
        productName: { $regex: searchQuery, $options: 'i' }, // Case-insensitive partial match
        salePrice: { $gt: minPrice, $lt: maxPrice },
      };
  
      // Apply active category filter if present
      const activeCategory = req.query.category;
      if (activeCategory) {
        query.category = activeCategory;
      }
  
      // Apply active brand filter if present
      const activeBrand = req.query.brand;
      if (activeBrand) {
        const brandDoc = await Brand.findById(activeBrand);
        if (brandDoc) {
          query.brand = brandDoc.brandName;
        }
      }
  
      // Get total count for pagination
      const totalProducts = await Product.countDocuments(query);
      const totalPages = Math.ceil(totalProducts / limit);

      let userWishlist = [];
        if (req.session.user) {
            const user = await User.findById(req.session.user);
            userWishlist = user ? user.wishlist : [];
        }

  
      // Get products with pagination
      const products = await Product.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
  
      res.render('shop', {
        user: userData,
        products: products,
        category: categories,
        brand: brands,
        currentPage: page,
        totalPages,
        searchQuery: searchQuery,
        selectedCategory: activeCategory || '',
        selectedBrand: activeBrand || '',
        sortBy: req.query.sortBy || '',
        sortOrder: req.query.sortOrder || '',
        priceRange: {
          min: minPrice,
          max: maxPrice,
        },
        userWishlist
      });
  
    } catch (error) {
      console.error('Error in searchProducts:', error);
      res.redirect('/pageNotFound');
    }
  };
  

  //---------------------------------------------------------------------







const sortPrice = async (req, res) => {
  try {
      const user = req.session.user;
      const userData = user ? await User.findOne({ _id: user }) : null;
      const category = await Category.find({}).lean();
      const brand = await Brand.find({}).lean();

      const sort = req.query.sort || 'desc';

      // Use all products stored in session or fetch all unblocked products
      let products = req.session.filteredProducts || await Product.find({
          isBlocked: false,
          quantity: { $gt: 0 },
      }).lean();

      // Apply sorting to the entire dataset
      if (sort === 'asc') {
          products.sort((a, b) => a.salePrice - b.salePrice);
      } else if (sort === 'desc') {
          products.sort((a, b) => b.salePrice - a.salePrice);
      }

      req.session.filteredProducts = products; // Store sorted products

      // Pagination logic
      let itemsPerPage = 6;
      let currentPage = parseInt(req.query.page) || 1;
      let startIndex = (currentPage - 1) * itemsPerPage;
      let endIndex = startIndex + itemsPerPage;
      let totalPages = Math.ceil(products.length / itemsPerPage);
      const currentProduct = products.slice(startIndex, endIndex);

      let userWishlist = [];
        if (req.session.user) {
            const user = await User.findById(req.session.user);
            userWishlist = user ? user.wishlist : [];
        }


      res.render('shop', {
          user: userData,
          products: currentProduct,
          category: category,
          brand: brand,
          sort,
          totalPages,
          currentPage,
          userWishlist
      });
  } catch (error) {
      console.error('Error in sortPrice:', error);
      res.redirect('/pageNotFound');
  }
};








const sortByAlpha = async (req, res) => {
  try {
      const user = req.session.user;
      const userData = user ? await User.findOne({ _id: user }) : null;
      const category = await Category.find({}).lean();
      const brand = await Brand.find({}).lean();

      const sort = req.query.sort || 'az';

      // Use all products stored in session or fetch all unblocked products
      let products = req.session.filteredProducts || await Product.find({
          isBlocked: false,
          quantity: { $gt: 0 },
      }).lean();

      // Apply sorting to the entire dataset
      if (sort === 'az') {
          products.sort((a, b) => a.productName.localeCompare(b.productName));
      } else if (sort === 'za') {
          products.sort((a, b) => b.productName.localeCompare(a.productName));
      }

      req.session.filteredProducts = products; // Store alphabetically sorted products

      let userWishlist = [];
        if (req.session.user) {
            const user = await User.findById(req.session.user);
            userWishlist = user ? user.wishlist : [];
        }


      // Pagination logic
      let itemsPerPage = 6;
      let currentPage = parseInt(req.query.page) || 1;
      let startIndex = (currentPage - 1) * itemsPerPage;
      let endIndex = startIndex + itemsPerPage;
      let totalPages = Math.ceil(products.length / itemsPerPage);
      const currentProduct = products.slice(startIndex, endIndex);

      res.render('shop', {
          user: userData,
          products: currentProduct,
          category: category,
          brand: brand,
          sort,
          totalPages,
          currentPage,
          userWishlist
      });
  } catch (error) {
      console.error('Error in sortByAlpha:', error);
      res.redirect('/pageNotFound');
  }
};


  


  const  clearFilters = async (req, res) => {
    try {
      req.session.filteredProducts = null;
      res.redirect("/shop");
    } catch (error) {
      console.error(error);
    }
  };
  


  



  
  
    
  
  

module.exports = {
  loadHomepage, 
  pageNotFound, 
  loadSignup, 
  loadShoppingPage,
  signup,
  verifyOtp ,
  resendOtp,
  loadLogin,
  login,
  logout,
  aboutUs,
  filterProduct,
  filterByPrice,
  searchProducts,
  sortPrice,
  sortByAlpha,
  clearFilters
  
  
}