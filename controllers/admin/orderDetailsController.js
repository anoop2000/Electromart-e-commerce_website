const User = require('../../models/userSchema');
const Order = require('../../models/orderSchema')
const Product  = require('../../models/productSchema')
const Address = require('../../models/addressSchema')



// const orderList = async(req,res)=>{
//     try {
//         const page = Number(req.query.page) || 1;
//     const limit = 15;
//     const skip = (page - 1) * limit;

//     // Fetch total order count for pagination
//     const count = await Order.estimatedDocumentCount();

//     // Fetch order data with pagination and populate user details
//     const orderData = await Order.find()
//       .populate('userId', 'name') // Populate user name
//       .sort({ createdOn: -1 }) // Sort by newest first
//       .skip(skip)
//       .limit(limit);

//       if (!orderData || orderData.length === 0) {
//         console.log("No orders found for page:", page);
//         return res.redirect("/pageerror"); // Or show a message
//       }

//     res.render('orderList', { orderData, count, limit, page });
        
//     } catch (error) {
//         console.log("Error in loading order list page",error.message,error.stack);
//         res.redirect('/pageerror')

        
        
//     }
// }



const orderList = async (req, res) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = 15;
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
  


// const orderStatus = async (req, res) => {
//     try {
//       const orderData = await Order.findOne({ orderid: req.params.id })
//         .populate("address")
//         .populate("orderedItems.product"); // Populate products in orderedItems
  
//       if (!orderData) {
//         return res.status(404).send("Order not found");
//       }
  
//       res.render("orderStatus", { orderData, user: req.body.user });
//     } catch (error) {
//       console.error(error);
//       res.status(500).send("Internal Server Error");
//     }
//   };


// const orderStatus = async (req, res) => {
//     try {
//       console.log(`Fetching order with id: ${req.params.id}`);
//       const orderData = await Order.findOne({ _id: req.params.id })
//         .populate("address")
//         .populate("orderedItems.product");
        
//       if (!orderData) {
//         console.error(`Order not found for id: ${req.params.id}`);
//         return res.status(404).send("Order not found");
//       }
//       console.log(`Order data fetched successfully: ${orderData}`);
//       res.render("orderStatus", { orderData, user: req.body.user });
//     } catch (error) {
//       console.error("Error fetching order:", error);
//       res.status(500).send("Internal Server Error");
//     }
//   };




// const orderStatus = async (req, res) => {
//     try {
//       console.log(`Fetching order with id: ${req.params.id}`);
      
//       // Find the order by _id
//       const orderData = await Order.findOne({ _id: req.params.id })
//         .populate("address")
//         .populate("orderedItems.product");
      
//       // Check if the order exists
//       if (!orderData) {
//         console.error(`Order not found for id: ${req.params.id}`);
//         return res.status(404).send("Order not found");
//       }
  
//       console.log(`Order data fetched successfully: ${JSON.stringify(orderData)}`);
//       res.render("orderStatus", { orderData, user: req.body.user });
//     } catch (error) {
//       console.error("Error fetching order:", error);
//       res.status(500).send("Internal Server Error");
//     }
//   };
  
  

const orderStatus = async (req, res) => {
    try {
      const orderId = req.params.id;
      console.log(`Fetching order with id: ${orderId}`);
  
      const orderData = await Order.findOne({ _id: orderId })
        .populate("address")
        .populate("orderedItems.product");
  
      if (!orderData) {
        console.error(`Order not found for id: ${orderId}`);
        return res.status(404).send("Order not found");
      }
  
      res.render("orderStatus", { orderData, user: req.body.user });
    } catch (error) {
      console.error("Error fetching order:", error);
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
      res.redirect("/orderList");
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
      res.redirect("/orderList");
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
      res.redirect("/orderList");
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
      res.redirect("/orderList");
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
      res.redirect("/orderList");
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