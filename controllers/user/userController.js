
const User = require("../../models/userSchema");
const Category  = require('../../models/categorySchema')
const Product = require('../../models/productSchema')
const Brand = require('../../models/brandSchema')
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require('bcrypt');


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
      res.render('home',{user:userData, products :productData})
    }else{
      return res.render('home',{products :productData})
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


const loadShoppingPage = async (req,res) => {
  try  {
    const  user = req.session.user;
    const userData  = await User.findOne({_id : user})
    const categories = await Category.find({isListed : true})
    const categoryIds = categories.map((category)=> category._id.toString())
    const page  = parseInt(req.query.page) || 1;
    const limit  = 9;
    const skip = (page-1)*limit;

    //console.log("category ids:",categoryIds);
    

    const products = await Product.find({
      isBlocked : false,
      category : {$in :categoryIds},
      quantity :{$gt :0},

    }).sort({createdAt : -1}).skip(skip).limit(limit)
    
    const totalProducts = await Product.countDocuments({
      isBlocked: false,
      category :{$in : categoryIds},
      quantity : {$gt :0}
    })
    const totalPages = Math.ceil(totalProducts/limit);
    const brands = await Brand.find({isBlocked : false})
    const categoriesWithIds = categories.map(category =>({_id : category._id,name :category.name}))

    //console.log("category with  ids :",categoriesWithIds);
    
    

     res.render('shop',{
      user : userData,
      products : products,
      category : categoriesWithIds,
      brand : brands,
      totalProducts : totalProducts,
      currentPage : page,
      totalPages : totalPages
     });

     //console.log(products);
     

  }catch (error) {
    res.redirect('/pageNotFound')
    
  }
}

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

      console.log("Transporter created...");

      const info = await transporter.sendMail({
          from: process.env.NODEMAILER_EMAIL,
          to: email,
          subject: "Verify Your Account",
          text: `Your verification code is ${otp}`,
          html: `<b>Your OTP: ${otp}</b>`,
      });

      console.log("Email sent:", info);
      return info.accepted.length > 0;

  } catch (error) {
      console.error("Error sending email", error);
      return false;
  }
}



const signup = async (req, res) => {
  try {
      const { name,phone,email, password, cPassword } = req.body;

      // Check if passwords match
      // if (password !== cPassword) {
      //     return res.render("signup", { message: "Passwords do not match" });
      // }

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
      req.session.userData = { name,phone,email, password };

      console.log("OTP Sent:", otp);

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

      console.log(otp);

      if(otp === req.session.userOtp){
          const user = req.session.userData
          const passwordHash  = await securePassword(user.password) 

          const saveUserData = new User({
            name : user.name,
            email : user.email,
            phone : user.phone,
            password : passwordHash
          })

          await saveUserData.save();

          req.session.user= saveUserData._id;

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
        console.log("Resend OTP :",otp);
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



  const filterProduct  = async(req,res)=>{
    try {
      const user = req.session.user;
      const category = req.query.category;
      const brand = req.query.brand;

      const findCategory = category ? await Category.findOne({_id : category}) : null;
      const findBrand= brand ? await Brand.findOne({_id : brand}) : null;
      const brands = await Brand.find({}).lean();

      const query = {
        isBlocked : false,
        quantity : {$gt :0},

      }
        if(findCategory){
          query.category = findCategory._id;

        }

        if(findBrand){
          query.brand = findBrand.brandName;
        }
      
        let findProducts = await Product.find(query).lean();//retrive as objects from mongoDB
        findProducts.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));

        const categories = await Category.find({isListed :true});

        let itemsPerPage = 3;
        let currentPage = parseInt(req.query.page) || 1
        let startIndex = (currentPage-1) * itemsPerPage
        let endIndex = (startIndex+itemsPerPage)
        let totalPages = Math.ceil(findProducts.length/itemsPerPage)
        let currentProduct = findProducts.slice(startIndex,endIndex);
        let userData = null;
        if(user){
          userData = await User.findOne({_id : user});
          if(userData){
            const searchEntry = {
              category : findCategory ? findCategory._id : null,
              brand : findBrand ? findBrand.brandName : null,
              searchedOn : new Date()
          }
          userData.searchHistory.push(searchEntry)
          await userData.save()
        }
      }

      req.session.filteredProducts =  currentProduct;

      return res.render('shop',{
        user : userData,
        products : currentProduct,
        category: categories,
        brand : brands,
        totalPages,
        currentPage,
        selectedCategory : category || null,
        selectedBrand : brand || null
      })
      
      

    } catch (error) {
      console.error("Error in filterProduct:", error);
      res.redirect('/pageNotFound')
      
    }
  }





  const filterByPrice = async(req,res)=>{
    try {

      const user = req.session.user;
      const userData = await User.findOne({_id: user})
      const brands = await Brand.find({}).lean()
      const categories = await Category.find({isListed : true}).lean();
      
      let findProducts = req.session.filteredProducts || await Product.find({
        //salePrice : {$gt: req.query.gt,$lt : req.query.lt},
        isBlocked : false,
        quantity : {$gt :0}
      }).lean()

      // Apply the price filter
      findProducts = findProducts.filter(
      (product) => product.salePrice > req.query.gt && product.salePrice < req.query.lt
    );

      findProducts.sort((a,b)=>new Date(b.createdAt) - new Date(a.createdAt))

      let itemsPerPage = 6;
      let currentPage = parseInt(req.query.page) || 1;
      let startIndex = (currentPage-1) * itemsPerPage
      let endIndex = startIndex+itemsPerPage;
      let totalPages = Math.ceil(findProducts.length/itemsPerPage)
      const currentProduct = findProducts.slice(startIndex,endIndex)

      req.session.filteredProducts = findProducts;
      return res.render('shop',{
        user : userData,
        products :  currentProduct,
        category : categories,
        brand : brands,
        totalPages,
        currentPage,



      })


      
    } catch (error) {
      console.error("Error in filtering products",error);
      res.redirect('/pageNotFound')
      
    }
  }


  

  
  const searchProducts = async (req, res) => {
    try {
      const user = req.session.user;
      const userData = user ? await User.findOne({ _id: user }) : null;
      const search = req.body.query?.trim(); 
      if (!search) {
        return res.render('shop', {
          user: userData,
          products: [],
          category: [],
          brand: [],
          totalPages: 0,
          currentPage: 1,
          count: 0,
        });
      }
  
      const brands = await Brand.find({}).lean();
      const categories = await Category.find({ isListed: true }).lean(); 
      const categoryIds = categories.map((category) => category._id.toString());
      let searchResult = [];
  
      if (req.session.filteredProducts && req.session.filteredProducts.length > 0) {
        // Filter from session-stored products
        searchResult = req.session.filteredProducts.filter((product) =>
          product.productName.toLowerCase().includes(search.toLowerCase())
        );
      } else {
        // Query database for products matching the search
        searchResult = await Product.find({
          productName: { $regex: ".*" + search + ".*", $options: "i" },
          isBlocked: false,
          quantity: { $gt: 0 },
          category: { $in: categoryIds },
        }).lean(); // Use .lean() for plain JavaScript objects
      }
  
      
      searchResult.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const itemsPerPage = 6;
      const currentPage = parseInt(req.query.page) || 1;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const totalPages = Math.ceil(searchResult.length / itemsPerPage);
      const currentProduct = searchResult.slice(startIndex, endIndex);
  
      
      return res.render('shop', {
        user: userData,
        products: currentProduct,
        category: categories,
        brand: brands,
        totalPages,
        currentPage,
        count: searchResult.length,
       
      });
    } catch (error) {
      console.error("Error in searchProducts:", error);
      if (!res.headersSent) {
        return res.redirect("/pageNotFound");
      }
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
    
      let products = req.session.filteredProducts || await Product.find({ isBlocked: false, quantity: { $gt: 0 } }).lean();
  
      if (sort === 'asc') {
        products.sort((a, b) => a.salePrice - b.salePrice); 
      } else if (sort === 'desc') {
        products.sort((a, b) => b.salePrice - a.salePrice); 
      }

      let itemsPerPage = 6;
      let currentPage = parseInt(req.query.page) || 1;
      let startIndex = (currentPage-1) * itemsPerPage
      let endIndex = startIndex+itemsPerPage;
      let totalPages = Math.ceil(products.length/itemsPerPage)
      const currentProduct = products.slice(startIndex,endIndex)
    
      
      res.render('shop', {
        user: userData,
        products: currentProduct,
        category: category,
        brand: brand,
        sort, 
        totalPages,
        currentPage,
      });
    } catch (error) {
      console.error('Error in sortPrice:', error);
      res.redirect('/pageNotFound');
    }
  };
  


  const sortByAlpha  = async (req, res) => {
    try {
      const user = req.session.user;
      const userData = user ? await User.findOne({ _id: user }) : null;
      const category = await Category.find({}).lean();
      const brand = await Brand.find({}).lean();
  
      
      const sort = req.query.sort || 'az'; 
  
     
      let products = req.session.filteredProducts || await Product.find({ isBlocked: false, quantity: { $gt: 0 } }).lean();
  
      if (sort === 'az') {
        
        products.sort((a, b) => a.productName.localeCompare(b.productName));
      } else if (sort === 'za') {
       
        products.sort((a, b) => b.productName.localeCompare(a.productName));
      }
  
      // Pagination
      let itemsPerPage = 6;
      let currentPage = parseInt(req.query.page) || 1;
      let startIndex = (currentPage - 1) * itemsPerPage;
      let endIndex = startIndex + itemsPerPage;
      let totalPages = Math.ceil(products.length / itemsPerPage);
      const currentProduct = products.slice(startIndex, endIndex);
  
      // Render the shop page
      res.render('shop', {
        user: userData,
        products: currentProduct,
        category: category,
        brand: brand,
        sort, 
        totalPages,
        currentPage,
      });
    } catch (error) {
      console.error('Error in sortPrice:', error);
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