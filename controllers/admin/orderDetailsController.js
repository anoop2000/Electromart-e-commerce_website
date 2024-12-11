const User = require('../../models/userSchema');
const Order = require('../../models/orderSchema')
const Product  = require('../../models/productSchema')
const Address = require('../../models/addressSchema')
const mongoose = require("mongoose");






const orderList = async (req, res) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;
  
      const count = await Order.estimatedDocumentCount();
      const orderData = await Order.find()
        .populate("userId", "name")
        .sort({ createdOn: -1 })
        .skip(skip)
        .limit(limit);
  
      if (!orderData) {
        console.log("No orders found");
        return res.status(404).send("No orders found");
      }
  
      res.render("orderList", { orderData, count, limit, page });
    } catch (error) {
      console.error("Error fetching orders:", error.message,error.stack);
      res.redirect("/pageerror");
    }
  };
  





// orderStatus
// const orderStatus = async (req, res) => {
//     try {
//       const orderData = await Order
//         .findOne({ _id: req.params.id })
//         .populate({
//           path: "address",
//           select: "address userId", // Only fetch necessary fields from Address
//         })
//         .populate({
//           path: "orderedItems.product",
//           select: "productName brand salePrice productImage", // Fetch product details
//         });
        
//       res.render("orderStatus", { orderData, user: req.body.user });
//     } catch (error) {
//       console.error("Error fetching order details:", error);
//       res.status(500).send("Internal Server Error");
//     }
//   };




const orderStatus = async (req, res) => {
    try {
      const orderData = await Order
        .findOne({ _id: req.params.id })
        .populate({
          path: "address",
          select: "address userId", // Fetch only the necessary fields
        })
        .populate({
          path: "orderedItems.product",
          select: "productName brand salePrice productImage", // Fetch product details
        });
  
      // If the address is populated, extract the first address or the matching address
      const selectedAddress = orderData?.address?.address?.find(addr => addr._id.equals(orderData.address));
  
      res.render("orderStatus", {
        orderData: {
          ...orderData.toObject(),
          address: selectedAddress,
        },
        user: req.body.user,
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  



  // pending
  const changeStatusPending = async (req, res) => {
    try {
      await Order.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { status: "Pending" } }
      );
      res.redirect("/admin/orderList");
    } catch (error) {
      console.error("Error in status change",error.message,error.stack);
    }
  };



//shipped
  const changeStatusShipped = async (req, res) => {
    try {
      await Order.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { status: "Shipped" } }
      );
      res.redirect("/admin/orderList");
    } catch (error) {
        console.error("Error in status change",error.message,error.stack);
    }
  };



  //deliverd
const changeStatusDelivered = async (req, res) => {
    try {
      await Order.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { status: "Delivered" } }
      );
    res.redirect("/admin/orderList");
    
    } catch (error) {
        console.error("Error in status change",error.message,error.stack);
    }
  };



  //return
const changeStatusReturn = async (req, res) => {
    try {
      await Order.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { status: "Return" } }
      );
      res.redirect("/admin/orderList");
    } catch (error) {
        console.error("Error in status change",error.message,error.stack);
    }
  };



  const changeStatusCancelled = async (req, res) => {
    try {
      let orderData = await Order
        .findOne({ _id: req.params.id })
        .populate("userId");
    //   await User.findByIdAndUpdate(
    //     { _id: orderData.userId._id },
    //     { wallet: orderData.grandTotalCost }
    //   );
      orderData.status = "Cancelled";
      orderData.save();
      res.redirect("/admin/orderList");
    } catch (error) {
        console.error("Error in status change",error.message,error.stack);
    }
  };


  

module.exports = {
    orderList,
    orderStatus,
    changeStatusPending,
    changeStatusShipped,
    changeStatusDelivered,
    changeStatusReturn,
    changeStatusCancelled
};