const User = require('../../models/userSchema');
const Order = require('../../models/orderSchema')
const Product  = require('../../models/productSchema')
const Address = require('../../models/addressSchema')
const mongoose = require("mongoose");
const Wallet = require("../../models/walletSchema.js")






const orderList = async (req, res) => {
    try {
      //console.log("Inside the admin order list");
      
      const page = parseInt(req.query.page, 10) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;
  
      const count = await Order.estimatedDocumentCount();
      const orderData = await Order.find()
        .populate("userId", "name")
        .sort({ createdAt: -1 })
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

      //console.log("Inside the order success");
      //console.log("orderId:", orderId);

      
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

      orderData.finalAmount = orderData.totalPrice - orderData.discount;

      
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
// const changeStatusReturn = async (req, res) => {
//     try {
//       await Order.findOneAndUpdate(
//         { _id: req.params.id },
//         { $set: { status: "Return" } }
//       );
//       res.redirect("/admin/orderList");
//     } catch (error) {
//         console.error("Error in status change",error.message,error.stack);
//     }
//   };




const changeStatusReturn = async (req, res) => {
  try {
    // Fetch the order and populate the userId field
    const order = await Order.findOne({ _id: req.params.id }).populate("userId");
    if (!order) {
      throw new Error('Order not found');
    }

    // Calculate the refund amount
    const refundAmount = order.finalAmount - order.discount;

    // Find the user associated with the order
    const user = await User.findById(order.userId._id);
    if (user) {
      // Ensure wallet is initialized, default to 0 if undefined
      user.wallet = user.wallet || 0;

      // Add refund amount to user's wallet
      user.wallet += refundAmount;

      // Create a wallet transaction for the return
      const transaction = new Wallet({
        userId: user._id, // Associate transaction with user
        amount: refundAmount,
        status: "Returned",
        description: `Refund for order #${order.orderid}`,
      });

      // Save the wallet transaction
      await transaction.save();

      // Add transaction to wallet history
      user.walletHistory = user.walletHistory || [];
      user.walletHistory.push(transaction._id);

      // Save the updated user data
      await user.save();
    } else {
      throw new Error('User not found');
    }

    // Update order status to "Returned"
    order.status = "Returned";
    await order.save();

    // Log success message and wallet history
    //console.log(`Order #${order.orderid} status updated to 'Returned'`);
    //console.log('Updated Wallet History:', user.walletHistory);

    // Redirect to order management page
    res.redirect("/admin/orderList");
  } catch (error) {
    console.error("Error processing return:", error);
    res.status(500).send("An error occurred while processing the return.");
  }
};








  const changeStatusCancelled = async (req, res) => {
    try {
      // Fetch the order and populate the userId field
      const orderData = await Order.findOne({ _id: req.params.id }).populate("userId");
      if (!orderData) {
        throw new Error("Order not found");
      }
  
      // Calculate the refund amount
      const refundAmount = orderData.finalAmount - orderData.discount;
  
      // Fetch the user associated with the order
      const user = await User.findById(orderData.userId._id);
      if (user) {
        // Ensure wallet is initialized, default to 0 if undefined
        user.wallet = user.wallet || 0;
  
        // Add refund amount to user's wallet
        user.wallet += refundAmount;
  
        // Create a wallet transaction for the refund
        const transaction = new Wallet({
          userId: user._id, // Associate transaction with user
          amount: refundAmount,
          status: "Refund",
          description: `Refund for cancelled order #${orderData.orderid}`,
        });
  
        // Save the wallet transaction
        await transaction.save();
  
        // Add transaction to wallet history
        user.walletHistory = user.walletHistory || [];
        user.walletHistory.push(transaction._id);
  
        // Save the updated user data
        await user.save();
      } else {
        throw new Error("User not found");
      }


       // Update product quantities in stock
       for (const item of orderData.orderedItems) {
        const product = await Product.findById(item.product._id);
        if (product) {
            product.quantity += item.quantity; // Add the ordered quantity back to stock
            await product.save();
        } else {
            console.warn(`Product not found for ID: ${item.product._id}`);
        }
    }
  
      // Update order status to "Cancelled"
      orderData.status = "Cancelled";
      await orderData.save();
  
      // Redirect to order management page
      res.redirect("/admin/orderList");
    } catch (error) {
      console.error("Error in status change", error.message, error.stack);
      res.status(500).send("An error occurred while processing the cancellation.");
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