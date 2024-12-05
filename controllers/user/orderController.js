const User = require('../../models/userSchema')
const Order = require('../../models/orderSchema')
const Product = require('../../models/productSchema')
const Address = require('../../models/addressSchema')
const Cart = require('../../models/cartSchema')
const session = require('express-session')


const ordersList = async (req, res) => {
    try {
      console.log("Fetching orders for the user.");
  
      const userId = req.session.user; // Retrieve the logged-in user's ID
      if (!userId) {
        return res.redirect('/login'); // Redirect to login if the user is not authenticated
      }
  
      // Fetch orders for the logged-in user
      const orders = await Order.find({ userId })
        .populate('orderedItems.product', 'productName')// Populate product name
         
        .lean(); // Convert to plain JavaScript objects for rendering
  
      if (!orders || orders.length === 0) {
        console.log("No orders found for the user.");
        return res.render('userProfile', { orders: [], message: 'No orders found.' });
      }
  
      console.log("Orders fetched:", orders);
  
      // Render the user profile with orders
      res.render('userProfile', { orders, message: null });
      
    } catch (error) {
      console.error('Error fetching orders:', error.message, error.stack);
      res.status(500).send('An error occurred while fetching orders.');
    }
  };





const deleteOrder = async (req, res) => {
    try {
      const { orderId } = req.params; // Access orderId from the URL
      const deletedOrder = await Order.findOneAndDelete({ orderid: orderId });
  
      if (!deletedOrder) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }
  
      res.status(200).json({ success: true, message: 'Order deleted successfully.' });
    } catch (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ success: false, message: 'An error occurred while deleting the order.' });
    }
  };
  
  


  module.exports = {
   ordersList,
   deleteOrder
  }




