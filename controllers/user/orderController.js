const User = require('../../models/userSchema')
const Order = require('../../models/orderSchema')
const Product = require('../../models/productSchema')
const Address = require('../../models/addressSchema')
const Cart = require('../../models/cartSchema')
const session = require('express-session')
const mongoose = require("mongoose");















const ordersList = async (req, res) => {
    try {
        console.log("Fetching orders for the user.");

        const userId = req.session.user; // Retrieve the logged-in user's ID
        if (!userId) {
            return res.redirect('/login'); // Redirect to login if the user is not authenticated
        }

        const orders = await Order.find({ userId })
            .populate({
                path: 'orderedItems.product',
                select: 'productName salePrice description brand color productImage', // Fetch all required product fields
            })
            .populate({
                path: 'address',
                select: 'address', // Populate the entire address array
                model: 'Address',
            }).sort({ createdOn: -1 })
            .lean();

        // Map over the orders to structure the data appropriately
        const enrichedOrders = orders.map(order => {
            let selectedAddress = null;

            // Extract the address details from the address document
            if (order.address && Array.isArray(order.address.address)) {
                selectedAddress = order.address.address.find(addr => addr); // Get the first address or adjust logic as needed
            }

            return {
                ...order,
                address: selectedAddress || null, // Replace with null if no address is found
            };
        });

        if (!enrichedOrders.length) {
            console.log("No orders found for the user.");
            return res.render('user/userProfile', { orders: [], message: 'No orders found.' });
        }

        console.log("Orders fetched:", enrichedOrders);

        // Render the user profile with orders
        res.render('user/userProfile', { orders: enrichedOrders, message: null });
    } catch (error) {
        console.error('Error fetching orders:', error.message, error.stack);
        res.status(500).send('An error occurred while fetching orders.');
    }
};












const viewDetails = async (req, res) => {
    try {

        console.log("Inside view details page");
        
      const orderId = req.query.id;

      console.log("OrderId :",orderId);
      


  
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ error: "Invalid Order ID" });
      }
  
      // Fetch order with populated fields
      const order = await Order.findById(orderId)
        .populate('orderedItems.product', 'productName salePrice description productImage')
        .populate({
            path: 'address',
            select: 'address', // Select only the 'address' array
          })
  
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
  
      res.json({ success: true, order });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server Error" });
    }
  };
  
  
  













const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params; // Retrieve the order ID from the route
        const order = await Order.findOne({ orderid: id }); // Ensure ID is used directly here

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status === "Delivered" || order.status === "Returned") {
            return res.status(400).json({ 
                message: `You cannot cancel this order because the order status is ${order.status}.` 
            });
        }

        if (order.status === "Pending" || order.status === "Shipped") {
            order.status = "Cancelled"; // Update the status to "Cancelled"
            await order.save();
            return res.status(200).json({ message: "Order successfully cancelled." });
        }

        res.status(400).json({ message: "Order cannot be cancelled at this stage." });
    } catch (error) {
        console.error("Error cancelling order:", error);
        res.status(500).json({ message: "An error occurred while cancelling the order." });
    }
};







  
  


  module.exports = {
   ordersList,
   cancelOrder,
   viewDetails
   
  }




