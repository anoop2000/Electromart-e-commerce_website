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
            }).sort({createdOn : -1})
            .lean();

            console.log("Sorted Orders:", orders.map(order => order.createdOn));

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

        console.log("Final enriched orders:", enrichedOrders.map(order => order.createdOn));


        console.log('Rendering userProfile with:', {
            orders: enrichedOrders,
            message: null,
            activeTab: 'orders'
        });
        


        // Render the user profile with orders
        res.render('user/userProfile', { orders: enrichedOrders, message: null}); // Specify the active tab
    } catch (error) {
        console.error('Error fetching orders:', error.message, error.stack);
        res.status(500).send('An error occurred while fetching orders.');
    }
};









const viewDetails = async (req, res) => {
    try {
        console.log("Fetching order details...");

        const userId = req.session.user;
        const orderId = req.query.id;

        const order = await Order.findOne({ _id: orderId })
            .populate('orderedItems.product', 'productName salePrice productImage') // Include necessary fields
            .lean();

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const userAddresses = await Address.findOne({ userId }).lean();

       


        const deliveryAddress = userAddresses?.address?.find(
            addr => addr._id.toString() === order.address.toString()
        );

        const responseData = {
            orderId: order.orderid,
            invoiceDate: order.invoiceDate,
            products: order.orderedItems.map(item => ({
                productName: item.product.productName,
                price: item.price,
                quantity: item.quantity,
                productImage: item.product.productImage[0], // Use first image
            })),
            totalPrice: order.totalPrice,
            discount: order.discount,
            finalAmount: order.finalAmount,
            address: deliveryAddress || {},
            paymentType: order.paymentType,
            status: order.status,
            reason: order.cancellationReason,
            createdOn: order.createdOn,
        };

        res.json({ success: true, data: responseData });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: 'Error loading order details' });
    }
};






// const cancelOrder = async (req, res) => {
//     try {
//         const { id } = req.params; // Retrieve the order ID from the route
//         console.log("Id :",id);
        
        

//         const { reason } = req.body;
//         console.log("Reason :",reason)
        
        
//         const userId = req.session.user;
//         const order = await Order.findOne({ orderid: id }); // Ensure ID is used directly here

//         if (!order) {
//             return res.status(404).json({ message: "Order not found" });
//         }

//         if (order.status === "Delivered" || order.status === "Returned") {
//             return res.status(400).json({ 
//                 message: `You cannot cancel this order because the order status is ${order.status}.` 
//             });
//         }

    
//         if (order.status === "Pending" || order.status === "Shipped") {
//             // Restore the product quantities
//             for (const item of order.orderedItems) {
//               const { product, quantity } = item;
      
//               // Increment product stock
//               const productDoc = await Product.findById(product._id);
//               if (productDoc) {
//                 productDoc.quantity += quantity;
//                 if(productDoc.quantity){
//                     productDoc.status = "Available";
//                 }
//                 await productDoc.save();
//               }
//             }

//             order.status = "Cancelled";
//             //          order.cancellationReason = reason;
//             // await order.save();

//             order.set('cancellationReason', reason);
// await order.save();

//                 console.log("cancellationReason :",order.cancellationReason);
                

//              //return res.status(200).json({ message: "Order successfully cancelled and inventory restored." });
//             return res.status(200).json({ 
//                 message: "Order successfully cancelled and inventory restored.", 
//                 reason: order.cancellationReason 
//               });
//         }



//         res.status(400).json({ message: "Order cannot be cancelled at this stage.", });
//     } catch (error) {
//         console.error("Error cancelling order:", error);
//         res.status(500).json({ message: "An error occurred while cancelling the order." });
//     }
// };




const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params; // Retrieve the order ID from the route
        console.log("Id :", id);

        const { reason } = req.body;
        console.log("Reason :", reason);

        const order = await Order.findOne({ orderid: id }); // Ensure ID is used directly here

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.status === "Delivered" || order.status === "Returned") {
            return res.status(400).json({ 
                message: `You cannot cancel this order because the order status is ${order.status}.` 
            });
        }

        if (reason) {
            // Update cancellation reason and status if the reason is provided
            order.set('cancellationReason', reason);
            order.set('status', 'Cancelled');
            await order.save();

            console.log("cancellationReason :", order.cancellationReason);

            return res.status(200).json({ 
                message: "Order successfully cancelled.", 
                reason: order.cancellationReason 
            });
        }

        if (order.status === "Pending" || order.status === "Shipped") {
            // Restore the product quantities
            for (const item of order.orderedItems) {
                const { product, quantity } = item;

                // Increment product stock
                const productDoc = await Product.findById(product._id);
                if (productDoc) {
                    productDoc.quantity += quantity;
                    if (productDoc.quantity) {
                        productDoc.status = "Available";
                    }
                    await productDoc.save();
                }
            }

            order.set('status', 'Cancelled');
            await order.save();

            return res.status(200).json({ 
                message: "Order successfully cancelled and inventory restored.",
                reason: order.cancellationReason 
            });
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




