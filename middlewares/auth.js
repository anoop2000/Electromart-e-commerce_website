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




const adminAuth = (req,res,next)=>{
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data){
            next()
        }else{
            res.redirect('/admin/login')
        }
    })
    .catch(error=>{
        console.log("Error in adminauth middleware",error);
        res.status(500).send('Internal Server Error')
    })
}


const blockUserCheck = async(req,res,next)=>{

    try {
        
        const currentUser = await User.findOne({
          _id: req.session?.currentUser?._id,
        });
    
        
        if (currentUser?.isBlocked) {
          req.session.destroy(); 
          return res.redirect('/pageNotFound'); 
        }
    
       
        console.log('User is not blocked, proceeding...');
        next();
      } catch (error) {
        console.error("Error in blockUserMiddleware:", error.message,error.stack);
        
        res.status(500).send("An error occurred while processing your request.");
      }

    
}

module.exports = {
    userAuth,
    adminAuth,
    blockUserCheck

}

