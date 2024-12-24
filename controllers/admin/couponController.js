const Coupon = require('../../models/couponSchema')
const mongoose  = require('mongoose')


const loadCoupon = async(req,res)=>{

    try{
        const findCoupons  = await Coupon.find({});
        return res.render('coupon',{coupons : findCoupons})

    }catch(error){
        return res.redirect('/pageerror')

    }
}








const createCoupon = async (req, res) => {
    try {
      const data = {
        couponName: req.body.couponName.trim(),
        startDate: new Date(req.body.startDate + "T00:00:00"),
        endDate: new Date(req.body.endDate + "T00:00:00"),
        offerPrice: parseInt(req.body.offerPrice),
        minimumPrice: parseInt(req.body.minimumPrice),
      };
  
      // Check if coupon name already exists (case-insensitive)
      const existingCoupon = await Coupon.findOne({
        name: { $regex: `^${data.couponName}$`, $options: "i" },
      });
  
      if (existingCoupon) {
        return res.json({
          success: false,
          message: "A coupon with this name already exists.",
        });
      }
  
      const newCoupon = new Coupon({
        name: data.couponName,
        createdOn: data.startDate,
        expiredOn: data.endDate,
        offerPrice: data.offerPrice,
        minimumPrice: data.minimumPrice,
      });
  
      await newCoupon.save();
  
      return res.json({
        success: true,
        message: "Coupon added successfully!",
      });
    } catch (error) {
      console.error(error);
      res.json({
        success: false,
        message: "An error occurred while creating the coupon.",
      });
    }
  };
  



  

  




const editCoupon = async(req,res)=>{
    try {

        const id = req.query.id;
        const findCoupon = await Coupon.findOne({_id : id});
        res.render('edit-coupon',{
            findCoupon : findCoupon
        })
        
    } catch (error) {
        console.error(error);
        red.redirect('/pageerror')
        
        
    }
}



const updateCoupon = async(req,res)=>{
    try {
        couponId = req.body.couponId
        const objId = new mongoose.Types.ObjectId(couponId);
        const selectedCoupon = await Coupon.findOne({_id : objId})
        if(selectedCoupon){
            const startDate = new Date(req.body.startDate);
            const endDate = new Date(req.body.endDate);
            const updatedCoupon = await Coupon.updateOne(
                {_id : objId},
            {$set : {name : req.body.couponName,
                createdOn : startDate,
                expiredOn : endDate,
                offerPrice : parseInt(req.body.offerPrice),
                minimumPrice : parseInt(req.body.minimumPrice),
                
            }},{new :true}
        );
        if(updateCoupon !== null){
            res.send("Coupon updated  Successfully")
        }else{
            res.status(500).send("Coupon update failed")
        }
        }
    } catch (error) {
        console.error(error);
        res.redirect('/pageerror')
        
        
    }
}


const deleteCoupon =  async(req,res)=>{
    try {
        const id = req.query.id;
        await Coupon.deleteOne({_id : id});
        res.status(200).send({success : true, message : "Coupon deleted Successfully "})
        
    } catch (error) {
        console.error("Error deleting coupon",error);
        res.status(500).send({success: false, message : "Failed to delete coupon"})
        
        
    }
}





module.exports = {
    loadCoupon,
    createCoupon,
    editCoupon,
    updateCoupon,
    deleteCoupon
}
