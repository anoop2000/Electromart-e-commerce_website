const User = require('../../models/userSchema')
const Order = require('../../models/orderSchema')
const Product = require('../../models/productSchema')
const Address = require('../../models/addressSchema')
const Cart = require('../../models/cartSchema')
const session = require('express-session')







// const ordersList = async (req, res) => {
//     try {
//         console.log("Fetching orders for the user.");

//         const userId = req.session.user; // Retrieve the logged-in user's ID
//         if (!userId) {
//             return res.redirect('/login'); // Redirect to login if the user is not authenticated
//         }

       

//         const orders = await Order.find({ userId: userId })
//   .populate({
//     path: 'orderedItems.product',
//     select: 'productName salePrice  ' // Select only the necessary fields
//   })
//   .populate({
//     path: 'address',
//     select: 'address.addressType address.state address.phone address.altPhone' // Select required fields from address
//   })
//   .lean(); // Convert Mongoose documents to plain JS objects

  

// res.render('user/userProfile', { orders });


//         if (!orders || orders.length === 0) {
//             console.log("No orders found for the user.");
//             return res.render('userProfile', { orders: [], message: 'No orders found.' });
//         }

//         console.log("Orders fetched:", orders);

//         // Render the user profile with orders
//         res.render('userProfile', { orders, message: null });
//     } catch (error) {
//         console.error('Error fetching orders:', error.message, error.stack);
//         res.status(500).send('An error occurred while fetching orders.');
//     }
// };





// const ordersList = async (req, res) => {
//     try {
//       console.log("Fetching orders for the user.");
  
//       const userId = req.session.user; // Retrieve the logged-in user's ID
//       if (!userId) {
//         return res.redirect('/login'); // Redirect to login if the user is not authenticated
//       }
  
//       const orders = await Order.find({ userId: userId })
//         .populate({
//           path: 'orderedItems.product',
//           select: 'productName salePrice', // Select only the necessary fields
//         })
//         .populate({
//           path: 'address',
//           select: 'address', // Populate the entire address array
//           model: 'Address', // Ensure it references the correct model
//           match: { userId }, // Ensure only addresses for the current user are fetched
//         })
//         .lean(); // Convert Mongoose documents to plain JS objects
  
//       // Flatten the address array to fetch the first (or appropriate) address for each order
//       orders.forEach(order => {
//         if (order.address && Array.isArray(order.address.address) && order.address.address.length > 0) {
//           order.address = order.address.address[0]; // Use the first address (or adjust as needed)
//         } else {
//           order.address = null; // Handle cases where no address is found
//         }
//       });
  
//       if (!orders || orders.length === 0) {
//         console.log("No orders found for the user.");
//         return res.render('user/userProfile', { orders: [], message: 'No orders found.' });
//       }
  
//       console.log("Orders fetched:", orders);
  
//       // Render the user profile with orders
//       res.render('user/userProfile', { orders, message: null });
//     } catch (error) {
//       console.error('Error fetching orders:', error.message, error.stack);
//       res.status(500).send('An error occurred while fetching orders.');
//     }
//   };
  



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
   cancelOrder
   
  }




