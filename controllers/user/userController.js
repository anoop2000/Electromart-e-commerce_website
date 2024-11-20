
const User = require("../../models/userSchema");
const Category  = require('../../models/categorySchema')
const Product = require('../../models/productSchema')

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


const loadHomepage = async (req,res) => {
  try{

    const user = req.session.user
    const categories = await Category.find({isListed:true})

                                                         //console.log("Categories:", categories);

    let productData = await Product.find({
      isBlocked :false,
                                                          // category : {$in : categories.map(category=> category._id)},
      quantity : {$gt:0}
    })
                                                         //console.log("Products Before Slice:", productData);



    productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));




    productData = productData.slice(0,4)

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


const loadShopping = async (req,res) => {
  try  {
    return res.render('shop');
  }catch (error) {
    console.log("Shopping page is not loading", error);
    res.status(500).send("Server error")
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

          res.json({success: true,redirectUrl :"/"})


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

module.exports = {
  loadHomepage, 
  pageNotFound, 
  loadSignup, 
  loadShopping,
  signup,
  verifyOtp ,
  resendOtp,
  loadLogin,
  login,
  logout
}