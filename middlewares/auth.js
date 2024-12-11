const User = require('../models/userSchema')

const userAuth = (req,res,next)=>{

    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                next()
            }else{
                res.redirect('/login')
            }
        })
        .catch(error=>{
            console.log('Error in User auth middleware');
            res.status(500).send("Internal server error")
        })
    }else{
        res.redirect('/login')
    }


}




// const adminAuth = (req,res,next)=>{
//     User.findOne({isAdmin:true})
//     .then(data=>{
//         if(data){
//             next()
//         }else{
//             res.redirect('/admin/login')
//         }
//     })
//     .catch(error=>{
//         console.log("Error in adminauth middleware",error);
//         res.status(500).send('Internal Server Error')
//     })
// }




const adminAuth = (req, res, next) => {
    try {
        
        if (req.session && req.session.admin) {
            return next(); 
        }

        
        return res.redirect('/admin/login');
    } catch (error) {
        console.error("Error in adminAuth middleware:", error);
        return res.status(500).send('Internal Server Error');
    }
};








const blockUserCheck = async(req,res,next)=>{

    try {
        
        const currentUser = await User.findOne({
          _id: req.session?.currentUser?._id,
        });
    
        
        if (currentUser?.isBlocked) {
          req.session.destroy(); 
          return res.redirect('/pageNotFound'); 
        }
    
       
        //console.log('User is not blocked, proceeding...');
        next();
      } catch (error) {
        console.error("Error in blockUserMiddleware:", error.message,error.stack);
        
        res.status(500).send("An error occurred while processing your request.");
      }

    
}





const errorHandler = (err, req, res, next) => {
    
    console.error(`[Error] ${err.message}`, err.stack);

    
    const statusCode = err.status || 500;
    const errorMessage = err.message || "An unexpected error occurred. Please try again later.";

    
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
        return res.status(statusCode).json({
            success: false,
            message: errorMessage,
        });
    }

    
    res.status(statusCode).render("page-404", {
        message: errorMessage,
        statusCode,
    });
};






module.exports = {
    userAuth,
    adminAuth,
    blockUserCheck,
    errorHandler

}

