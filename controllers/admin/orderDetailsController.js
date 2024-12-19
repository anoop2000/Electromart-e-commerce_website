const User = require('../../models/userSchema');
const Order = require('../../models/orderSchema')
const Product  = require('../../models/productSchema')
const Address = require('../../models/addressSchema')
const mongoose = require("mongoose");






const orderList = async (req, res) => {
    try {
      console.log("Inside the admin order list");
      
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
  






const orderStatus = async (req, res) => {
  try {
      const orderId = req.params.id;

      console.log("Inside the order success");
      console.log("orderId:", orderId);

      
      const orderData = await Order
          .findOne({ _id: orderId })
          .populate({
              path: "orderedItems.product",
              select: "productName brand salePrice productImage", 
          })
          .lean(); 

      if (!orderData) {
          return res.status(404).send("Order not found");
      }

      //console.log("Order data:", orderData);

     
      const userAddresses = await Address.findOne({ userId: orderData.userId }).lean();

      if (!userAddresses || !userAddresses.address) {
          return res.status(404).send("User addresses not found");
      }

      const deliveryAddress = userAddresses.address.find(
          (addr) => addr._id.equals(orderData.address) 
      );

      if (!deliveryAddress) {
          return res.status(404).send("Delivery address not found");
      }

      //console.log("Delivery Address Details:", deliveryAddress);

      
      res.render("orderStatus", {
          orderData: {
              ...orderData, 
              addressDetails: deliveryAddress, 
          },
          user: req.body.user, 
      });
  } catch (error) {
      console.error("Error fetching order details:", error.stack, error.message);
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