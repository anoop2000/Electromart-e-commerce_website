const User  =  require('../../models/userSchema')
const Address = require('../../models/addressSchema')
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const env = require('dotenv').config()
const session = require('express-session')


function generateOtp(){
    const digits = "1234567890";  // A string containing all digits from 1 to 9 and 0
    let otp = "";  // Initialize an empty string to store the OTP
    for (let i = 0; i < 6; i++) {  // Loop 6 times to generate a 6-digit OTP
        otp += digits[Math.floor(Math.random() * 10)];  // Randomly pick a digit from 'digits' string and append it to otp
    }
    return otp;  // Return the generated OTP
}

const sendVerificationEmail  = async(email,otp)=>{
    try {

        const transporter = nodemailer.createTransport({
            service :"gmail",
            port :587,
            secure : false,
            requireTLS : true,
            auth: {
                user : process.env.NODEMAILER_EMAIL,
                pass : process.env.NODEMAILER_PASSWORD 
            }
        })

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to : email,
            subject :"Your OTP for password reset",
            text : `Your OTP is ${otp}`,
            html : `<b><h4>Your OTP : ${otp}</h4></b>`
        }

        const info = await transporter.sendMail(mailOptions)
        console.log("Email Sent :",info.messageId);
        return true;
        

        
    } catch (error) {
        console.error("Error sending email",error);
        return false;
        
        
    }
}


const securePassword = async(password)=>{
    try {

        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash
        
    } catch (error) {
        console.error("Error while hashing the password:", error.message);
    }
}



const userProfile = async(req,res)=>{   
    try {
        const userId=  req.session.user;
        const userData = await User.findById(userId)
        const addressData = await Address.findOne({userId : userId})

        const emailUpdated = req.session.emailUpdated || false;
        req.session.emailUpdated = null;
       
        res.render('userProfile',{
            user :userData,
            userAddress : addressData,
            emailUpdated 
        })
    } catch (error) {

        console.log('Error for retrieve profile data',error)
        res.redirect('/pageNotFound')
    }
}




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
            console.log("Generated OTP :",otp);
            
        }else{
            res.json({success :false,message : "Failed to send OTP, Please try again"})
        }
    }else {
        res.render("forgot-password",{
            message : "User with this email does not exist"
        })
    }


 }
        
    catch (error) {
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
        console.log("Resending OTP to email:",email);
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



const changePasswordValid = async(req,res)=>{
    try {
        const {email}  = req.body;
        const userExists = await User.findOne({email});
        if(userExists){
            const otp = generateOtp();
            const emailSent  = await sendVerificationEmail(email,otp);
            if(emailSent){
                req.session.userOtp = otp;
                req.session.userData = req.body;
                req.session.email = email;
                res.render('change-password-otp')
                console.log("OTP :",otp);
                
            }else{
                res.json({
                    success : false,
                    message :"Failed to send OTP,Please try again"
                })
            }
        }else{
            res.render('change-password',{
                message :"User with this email does not exists"
            })
        }
        
    } catch (error) {
        console.log("Error in change password validation",error);
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
    verifyChangePassOtp,
    addAddress,
    postAddAddress,
    editAddress
}