const User  =  require('../../models/userSchema')
const Address = require('../../models/addressSchema')
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const env = require('dotenv').config()
const session = require('express-session')
const Order = require('../../models/orderSchema')
const Cart = require('../../models/cartSchema')
const {generateInvoicePDF} = require('../../utils/invoiceUtils');
const Wallet  = require('../../models/walletSchema') 

function generateOtp(){
    const digits = "1234567890"; 
    let otp = "";  
    for (let i = 0; i < 6; i++) {  
        otp += digits[Math.floor(Math.random() * 10)];  
    }
    return otp;  
}




//---------------------------------------------------------------





const sendVerificationEmail = async(email, otp, type = 'reset-password') => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        // Different subject and title based on type
        let subject, headerTitle;
        if (type === 'change-password') {
            subject = "Your OTP for Password Reset";
            headerTitle = "Password Reset Request";
        } else {
            subject = "Your OTP for New Password Reset";
            headerTitle = "New Password Reset Request";
        }

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                    <h2 style="color: #333;">${headerTitle}</h2>
                </div>
                <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
                    <p>Hello,</p>
                    <p>We received a request to reset your password. Here is your OTP:</p>
                    <div style="background-color: #f8f9fa; padding: 15px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #007bff; margin: 0; letter-spacing: 5px;">${otp}</h1>
                    </div>
                    
                    <p>If you didn't request this password reset, please ignore this email.</p>
                    <p style="margin-top: 20px; color: #666; font-size: 14px;">
                        For security reasons, please do not share this OTP with anyone.
                    </p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                    <p>This is an automated email, please do not reply.</p>
                    <p>© ${new Date().getFullYear()} ElectroMart. All rights reserved.</p>
                </div>
            </div>
        `;

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        //console.log("Email sent successfully:", info.messageId);
        return true;

    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};




//---------------------------------------------------------------

const securePassword = async(password)=>{
    try {

        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash
        
    } catch (error) {
        console.error("Error while hashing the password:", error.message);
    }
}








const userProfile = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId).populate('walletHistory');
        const addressData = await Address.findOne({ userId: userId });

        const limit = 8; // Set limit for both orders and wallet history

        // Handle order pagination
        const ordersPage = parseInt(req.query.ordersPage) || 1;
        const ordersSkip = (ordersPage - 1) * limit;

        const orders = await Order.find({ userId })
            .populate('orderedItems.product')
            .sort({ createdAt: -1 })
            .skip(ordersSkip)
            .limit(limit)
            .lean();

        const totalOrders = await Order.countDocuments({ userId });
        const totalOrderPages = Math.ceil(totalOrders / limit);

        // Handle wallet history pagination
        const walletPage = parseInt(req.query.walletPage) || 1;
        const walletSkip = (walletPage - 1) * limit;

        const walletHistory = await Wallet.find({ userId })
            .sort({ date: -1 })
            .skip(walletSkip)
            .limit(limit)
            .lean();

        const totalWalletHistory = await Wallet.countDocuments({ userId });
        const totalWalletPages = Math.ceil(totalWalletHistory / limit);


        const totalReferralEarnings = userData.walletHistory
        .filter(transaction => transaction.description === 'Referral Bonus')
        .reduce((total, transaction) => total + transaction.amount, 0);

        console.log("totalreferralearnings :",totalReferralEarnings);

        const emailUpdated = req.session.emailUpdated || false;
        req.session.emailUpdated = null;

        res.render('userProfile', {
            user: userData,
            userAddress: addressData,
            emailUpdated,
            orders,
            walletHistory,
            activeTab: req.query.tab || 'dashboard',
            totalPages: {
                orders: totalOrderPages,
                walletHistory: totalWalletPages
            },
            currentPages: {
                orders: ordersPage,
                walletHistory: walletPage
            },
            totalOrders,
            totalWalletHistory,
            limit,
            totalReferralEarnings,
        });
    } catch (error) {
        console.log('Error retrieving profile data', error);
        res.redirect('/pageNotFound');
    }
};













const forgotEmailValid = async(req,res)=>{
    try {

        const {email} = req.body
        const findUser =  await User.findOne({email : email})
        if(findUser){
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email,otp)
            if(emailSent){
                req.session.userOtp = otp;
                req.session.email = email;
                res.render('forgot-pass-otp')
                //console.log("Generated OTP :",otp);
                
            }else{
                res.json({success :false,message : "Failed to send OTP, Please try again"})
            }
        }else {
            res.render("forgot-password",{
                message : "User with this email does not exist"
            })
        }
    
    
        
   }   catch (error) {
        res.redirect('/pageNotFound')
        
    }

}




const getForgotPassPage = async(req,res)=>{
    try {
        res.render('forgot-password')

        
    } catch (error) {
        res.reidrect('/pageNotFound')
        
    }
}


const verifyForgotPassOtp = async(req,res)=>{
    try {
        const enteredOtp = req.body.otp;
        if(enteredOtp === req.session.userOtp){
            res.json({success : true, redirectUrl :'/reset-password'});

        }else{
            res.json({success : false,message :"OTP not matching"})
        }
        
    } catch (error) {
        res.status(500).json({success :false,message :"An error occured.Please try again"})
        
    }
}



const getResetPassPage =async(req,res)=>{
    try {
        res.render('reset-password')
        
    } catch (error) {
        res.redirect('/pageNotFound')
        
    }
}


const resendOtp = async(req,res)=>{
    try {

        const otp = generateOtp();
        req.session.userOtp = otp;
        const email = req.session.email;
        //console.log("Resending OTP to email:",email);
        const emailSent = await sendVerificationEmail(email,otp);
        if(emailSent){
            console.log("Resend OTp :",otp);
            res.status(200).json({success : true,message : "Resend OTP Successful"})
            
        }
        
        
    } catch (error) {
        console.error("Error in resend OTP",error);
        res.status(500).json({success : false,message : "Internal server Error"})
        
        
    }
}


const postNewPassword = async(req,res)=>{
    try {
        const {newPass1,newPass2} = req.body;
        const email = req.session.email;
        if(newPass1 === newPass2){
            const passwordHash = await securePassword(newPass1)
            await User.updateOne({email : email},{$set:{password: passwordHash}})

            res.redirect('/login')
        }else{
            res.render('reset-password',{message: "Passwords do not match"})
        }
        



    } catch (error) {
        console.error("Error in postNewPassword:", error.message);
        res.redirect('/pageNotFound')
        
    }
}




const changeEmail = async(req,res)=>{
    try {
        res.render('change-email')
    } catch (error) {
        res.redirect('/pageNotFound')
        
    }
}


const changeEmailValid = async(req,res)=>{
    try {
        const {email} = req.body;
        const userExists = await User.findOne({email})
        if(userExists){
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email,otp)
            if(emailSent){
                req.session.userOtp = otp;
                req.session.userData = req.body;
                req.session.email = email;
                res.render('change-email-otp');
                console.log("Email sent: ",email);
                console.log("Generated OTP ",otp);
                
                
            }else{
                res.json("Email-error")
            }
        }else{
            res.render('change-email',{
                message : "User with this email not Exists"
            })
        }
        
    } catch (error) {
        res.redirect('/pageNotFound')
        
    }
}



const verifyEmailOtp = async(req,res)=>{
    try {

        const enteredOtp = req.body.otp;
        if(enteredOtp === req.session.userOtp){
            req.session.userData = req.body.userData;
            res.render('new-email',{
                userData : req.session.userData, 
                otpVerified: true,
            })
        }else {
            res.render('change-email-otp',{
                message : 'OTP not matching',
                userData : req.session.userData
            })
        }
        
    } catch (error) {
        res.redirect('/pageNotFound')
        
    }
}



const updateEmail = async(req,res)=>{
    try {
        const {newEmail} = req.body
        console.log(req.body);
        
        const userId = req.session.user;
        console.log(userId);
        
        await User.findByIdAndUpdate(userId,{email:newEmail})

        // Setting a flag in the session for success message
        req.session.emailUpdated = true;

        res.redirect('/userProfile')
    } catch (error) {
        res.redirect('/pageNotFound')
        
    }
}


const changePassword = async(req,res)=>{
    try {

        res.render('change-password')
        
    } catch (error) {
        res.redirect('/pageNotFound')
        
    }
}







const changePasswordValid = async (req, res) => {
    try {
        const { email } = req.body;
        const userId = req.session.user;

        // Check if user is logged in
        if (!userId) {
            return res.json({
                success: false,
                message: "User is not logged in. Please log in to continue."
            });
        }

        // Fetch logged-in user's details
        const loggedInUser = await User.findById(userId);

        if (!loggedInUser) {
            return res.json({
                success: false,
                message: "User not found. Please log in again."
            });
        }

        // Compare entered email with logged-in user's email
        if (loggedInUser.email !== email) {
            return res.json({
                success: false,
                message: "Entered email does not match the logged-in user's email."
            });
        }

        // Generate and send OTP
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);

        if (emailSent) {
            // Store OTP and email in session
            req.session.userOtp = otp;
            req.session.userData = req.body;
            req.session.email = email;
            //console.log("OTP sent:", otp);

            // Respond with success and redirect URL
            return res.json({
                success: true,
                redirectUrl: '/verify-changepassword-otp'
            });
        } else {
            return res.json({
                success: false,
                message: "Failed to send OTP. Please try again."
            });
        }

    } catch (error) {
        console.error("Error in changePasswordValid:", error);
        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred. Please try again."
        });
    }
};





const getchangePassOtp = async(req,res)=>{
    try {
        res.render('change-password-otp')
        
    } catch (error) {
        res.redirect('/pageNotFound')
        
    }
}  



const verifyChangePassOtp = async(req,res)=>{
    try {
        const enteredOtp = req.body.otp;
        if(enteredOtp === req.session.userOtp){
            res.json({success :true,redirectUrl : "/reset-password"})
        }else{
            res.json({success :false,message :"OTP not matching"})
        }
        
    } catch (error) {
        res.status(500).json({success : false, message :"An error occured,Please try again"})
        
    }
}




const addAddress = async(req,res)=>{
    try {
        const user = req.session.user;
        
        
        res.render('add-address',{user : user})
        
    } catch (error) {
        res.redirect('/pageNotFound')
        
    }

}

const postAddAddress = async(req,res)=>{
    try {
        const userId  = req.session.user;
        const userData = await User.findOne({_id:userId})
        const {addressType ,name,city,landMark,state,pincode,phone,altPhone} = req.body;

        const userAddress = await Address.findOne({userId :userData._id})
        if(!userAddress){
            const newAddress = new Address({
                userId : userData._id,
                address : [{addressType,name,city,landMark,state,pincode,phone,altPhone}]
            });
            await newAddress.save()
        }else{
            userAddress.address.push({addressType,name,city,landMark,state,pincode,phone,altPhone})
            await userAddress.save()
        }
        res.redirect('/userProfile')
    } catch (error) {
        console.error("Error adding address :",error);
        res.reidrect('/pageNotFound')
        
    }
}



const editAddress = async(req,res)=>{

    try {
        const addressId = req.query.id;
        const user = req.session.user;
        const currentAddress = await Address.findOne({
            'address._id' : addressId
        })

        if(!currentAddress){
            return res.redirect('/pageNotFound')
        }
        const addressData = currentAddress.address.find((item)=>{
            return item._id.toString() === addressId.toString();
        })
        if(!addressData){
            return res.redirect('/pageNotFound')
        }

        res.render('edit-address',{
            address : addressData,
            user : user
        })
        
    } catch (error) {
        console.error("Error in editing address",error);
        res.redirect('/pageNotFound')
        
        
        
    }
}




const postEditAddress = async(req,res)=>{
    try {
        const data = req.body;
        const addressId  = req.query.id;
        const user = req.session.user;
        const findAddress = await Address.findOne({'address._id' : addressId})
        
        if(!findAddress){
            res.redirect("/pageNotFound")
        }
        await Address.updateOne(
            {'address._id' : addressId},
            {$set :{
                "address.$" : {
                    _id : addressId,
                    addressType : data.addressType,
                    name : data.name,
                    city : data.city,
                    landMark : data.landMark,
                    state : data.state,
                    pincode : data.pincode,
                    phone : data.phone,
                    altPhone : data.altPhone

                }
            }}
        )

        res.redirect('/userProfile')
    } catch (error) {
        console.error("Error in edit address",error);
        res.redirect('/pageNotFound')
        
        
    }
}





const deleteAddress = async(req,res)=>{
    try {
        const addressId = req.query.id;
        const findAddress = await Address.findOne({'address._id' : addressId}) 
        if(!findAddress){
            return res.status(404).send("Address not found")
        }
        await Address.updateOne({
            "address._id" : addressId
        },
        {
            $pull:{
                address : {
                    _id : addressId,
                }
            }
        }
    
    )

    res.redirect('/userProfile');
        
    } catch (error) {
        console.error("Error in delete address",error);
        res.redirect('/pageNotFound')
        
    }
}


const getEditProfile = async(req,res)=>{
    try {
        const userId = req.session.user;
        const user = await User.findOne({_id:userId})


        res.render('edit-profile',{
            user : user,
            name : user.name,
            phone : user.phone
        })
        
    } catch (error) {
        res.redirect('/pageNotFound',{message:"Error while editing user profile"})

        
    }
}



const updateProfile  =  async(req,res)=>{
    try {
        
        const userId  = req.session.user;
        const {name , phone} = req.body;
        const findUser = await User.findById(userId);

        if (!findUser) {
            return res.redirect("/pageNotFound");
        }

        await User.updateOne(
            {_id : userId},
            {$set :{name : name,phone : phone}}
        )

        res.redirect('/userProfile')
        
    } catch (error) {

        console.error("Error in updating profile:", error);
      res.redirect("/pageNotFound");
        
    }
}






const invoiceDownload = async (req, res) => {
    try {
        console.log("req.params.id:", req.params.id);

        const userId = req.session.user;

        // Fetch order data using the order ID from params
        let orderData = await Order.findOne({ _id: req.params.id })
            .populate('userId')  // Populate user details
            .populate('orderedItems.product'); // Populate product details

        if (!orderData) {
            return res.status(404).send("Order not found");
        }

        // Fetch user addresses
        const userAddresses = await Address.findOne({ userId });
        const orderObj = orderData.toObject(); // Convert to plain object

        let chosenAddress = null;

        if (userAddresses && userAddresses.address) {
            chosenAddress = userAddresses.address.find(
                addr => addr._id.toString() === orderData.address.toString()
            );
        }

        if (chosenAddress) {
            //console.log("Chosen address:", chosenAddress);
            // Replace address in the plain object for PDF generation
            orderObj.address = chosenAddress;
        } else {
            console.warn("No matching address found for this order.");
        }

        //console.log("Updated order object address:", orderObj.address);

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment;filename=invoice_${orderData._id}.pdf`);

        // Generate the PDF using the modified plain object
        generateInvoicePDF(
            (chunk) => res.write(chunk), // Write chunks to response
            () => res.end(),             // End the response when PDF generation is complete
            orderObj                     // Pass the modified plain object to the PDF generator
        );

    } catch (error) {
        console.error("Error generating invoice PDF:", error);
        res.status(500).send("An error occurred while generating the invoice.");
    }
};



  














module.exports = {
    userProfile,
    getForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassPage,
    resendOtp ,
    postNewPassword,
    changeEmail,
    changeEmailValid,
    verifyEmailOtp,
    updateEmail,
    changePassword,
    changePasswordValid,
    getchangePassOtp,
    verifyChangePassOtp,
    addAddress,
    postAddAddress,
    editAddress,
    postEditAddress,
    deleteAddress,
    getEditProfile,
    updateProfile,
    invoiceDownload,
    
    
}