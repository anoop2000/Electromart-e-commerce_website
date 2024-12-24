const User = require('../../models/userSchema')
const Order = require('../../models/orderSchema')
const Product = require('../../models/productSchema')
const Address = require('../../models/addressSchema')
const Cart = require('../../models/cartSchema')
const session = require('express-session')
const mongoose = require("mongoose");
const Wallet = require('../../models/walletSchema')









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
        res.redirect('user/userProfile', { orders: enrichedOrders, message: null}); // Specify the active tab
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









const cancelOrder = async (req, res) => {
    try {
        const orderId = req.params.id;

        console.log("req.params.id :", req.params.id);

        // Fetch the order and ensure it exists
        const order = await Order.findById(orderId).populate("orderedItems.product");
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update the order status to 'Cancelled' and save the reason
        const { reason } = req.body; // Capture the cancellation reason from the request body
        order.status = 'Cancelled';
        order.cancellationReason = reason; // Add a cancellationReason field to the Order schema
        await order.save();

        // Check if the payment type is not 'COD'
        if (order.paymentType !== "COD") {
            // Calculate refund amount based on finalAmount and discount
            const refundAmount = order.finalAmount - order.discount;

            // Fetch the user associated with the order
            const user = await User.findById(order.userId);
            if (!user) {
                return res.status(404).json({ message: 'User associated with the order not found' });
            }

            // Ensure wallet is initialized
            user.wallet = user.wallet || 0;

            // Add the refund amount to the user's wallet
            user.wallet += refundAmount;

            // Create a wallet transaction for the refund
            const transaction = new Wallet({
                userId: user._id,
                amount: refundAmount,
                status: 'Refund',
                description: `Refund for cancelled order #${order.orderid}`,
            });

            // Save the wallet transaction
            await transaction.save();

            // Add the transaction ID to the user's walletHistory
            user.walletHistory = user.walletHistory || [];
            user.walletHistory.push(transaction._id);

            // Save the updated user document
            await user.save();
        }

        // Update product stock for each item in the cancelled order
        for (const item of order.orderedItems) {
            const product = item.product;
            if (product) {
                product.quantity = (product.quantity || 0) + item.quantity; // Add the quantity back to stock
                await product.save(); // Save the updated product
            }
        }

        // Send success response with a message
        res.status(200).json({ success: true, message: 'Order successfully cancelled', reason: reason });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ message: 'An error occurred while processing the cancellation.' });
    }
};








const orderStatusPage = async (req, res) => {
    try {
        console.log("Rendering order status page...");

        // Check if the user is logged in
        if (!req.session.user || !req.session.user._id) {
            return res.redirect('/login');
        }

        const userId = req.session.user._id;
        const orderId = req.params.id;

        console.log("Order Id",orderId);
        

        // Fetch the order data
        const order = await Order.findOne({ _id: orderId })
            .populate('orderedItems.product', 'productName salePrice productImage') // Populate product details
            .lean();

        if (!order) {
            return res.redirect('/pageNotFound');
        }

        // Fetch the user's address details
        const userAddresses = await Address.findOne({ userId }).lean();

        // Match the order's address with the user's addresses
        const deliveryAddress = userAddresses?.address?.find(
            addr => addr._id.toString() === order.address.toString()
        );

        // Prepare the response data
        const responseData = {
            _id : orderId,
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
            address: deliveryAddress || {}, // Use matched address or an empty object
            paymentType: order.paymentType,
            status: order.status,
            reason: order.cancellationReason || 'N/A',
            createdOn: order.createdOn,
        };

        // Determine the order status
        const isCancelled = order.status === 'Cancelled';
        const isDelivered = order.status === 'Delivered';
        const isReturned = order.status === "Returned";

        // Render the `orderStatusPage` view with the fetched data
        res.render('orderStatusPage', {
            orderData: responseData,
            isCancelled,
            isDelivered,
            isReturned,
            user: req.session.user,
        });
    } catch (error) {
        console.error('Error rendering order status page:', error);
        res.redirect('/pageNotFound');
    }
};







const returnOrder = async (req, res) => {
    try {
        const orderId = req.params.id;

        console.log("req.params.id :", req.params.id);

        // Fetch the order and ensure it exists
        const order = await Order.findById(orderId).populate("orderedItems.product");
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update the order status to 'Returned'
        order.status = 'Returned';
        await order.save();

        // Calculate refund amount based on finalAmount and discount
        const refundAmount = order.finalAmount - order.discount;

        // Fetch the user associated with the order
        const user = await User.findById(order.userId);
        if (!user) {
            return res.status(404).json({ message: 'User associated with the order not found' });
        }

        // Ensure wallet is initialized
        user.wallet = user.wallet || 0;

        // Add the refund amount to the user's wallet
        user.wallet += refundAmount;

        // Create a wallet transaction for the refund
        const transaction = new Wallet({
            userId: user._id,
            amount: refundAmount,
            status: 'Refund',
            description: `Refund for returned order #${order.orderid}`,
        });

        // Save the wallet transaction
        await transaction.save();

        // Add the transaction ID to the user's walletHistory
        user.walletHistory = user.walletHistory || [];
        user.walletHistory.push(transaction._id);

        // Save the updated user document
        await user.save();

        // Update product stock for each item in the returned order
        for (const item of order.orderedItems) {
            const product = item.product;
            if (product) {
                product.quantity = (product.quantity || 0) + item.quantity; // Add the quantity back to stock
                await product.save(); // Save the updated product
            }
        }

        // Send success response with a message
        res.status(200).json({ success: true, message: 'Order successfully returned and refund added.' });
    } catch (error) {
        console.error('Error in returning order:', error);
        res.status(500).json({ message: 'An error occurred while processing the return of order.' });
    }
};




  


  


  
  


  module.exports = {
   ordersList,
   cancelOrder,
   viewDetails,
   orderStatusPage,
   returnOrder
   
  }




