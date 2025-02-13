const Cart = require('../../models/cartSchema')
const Product = require('../../models/productSchema')
const Category = require("../../models/categorySchema");
const User = require('../../models/userSchema')
const Address = require('../../models/addressSchema')
const Order = require('../../models/orderSchema')
const Coupon = require('../../models/couponSchema')
const razorpay = require('../../config/razorpay');
const crypto = require('crypto');
const Wallet = require('../../models/walletSchema')
const Brand = require('../../models/brandSchema')




//----------------------------------------------------------------------

async function grandTotal(req) {
    try {
        const userId = req.session.user; // Get the user ID from the session
        if (!userId) {
            throw new Error("User is not logged in.");
        }

        // Find the user's cart and populate the product details
        const cartData = await Cart.findOne({ userid: userId }).populate('items.productId');

        if (!cartData || cartData.items.length === 0) {
            req.session.grandTotal = 0; // No items, grand total is 0
            return [];
        }

        let grandTotal = 0;

        // Calculate the grand total and update totalPrice for each item
        for (const item of cartData.items) {
            const product = item.productId; // Populated product data
            if (!product) continue;

            // Calculate the total price for the current item
            item.totalPrice = item.quantity * product.salePrice;
            grandTotal += item.totalPrice;
        }

        

        // Save the updated cart with recalculated totalPrice values
        await cartData.save();



        // Store the grand total in the session
        req.session.grandTotal = grandTotal;

        // Return the updated cart data
        return cartData.items;
    } catch (error) {
        console.error('Error in grandTotal:', error);
        throw error;
    }
}




const renderCartPage = async (req, res) => {
    try {
                                             //console.log("Rendering Cart Page...1");

        // Get the user ID from the session
        const userId = req.session.user;
        if (!userId) {
            return res.redirect('/login'); // Redirect if not logged in
        }

        // Fetch the logged-in user's details
        const userData = await User.findById(userId);
        if (!userData) {
            return res.redirect('/login'); // Redirect if user not found
        }

        // Calculate the grand total and get updated cart data
        const userCartData = await grandTotal(req);

        // Render the cart page with necessary data
        res.render('addToCart', {
            user: userData,              // Pass logged-in user's details
            cartData: userCartData,      // Pass updated cart items
            grandTotal: req.session.grandTotal // Pass grand total
        });
    } catch (error) {
        console.error('Error rendering cart page:', error);
        res.redirect('/pageNotFound'); // Redirect to error page on failure
    }
};











//---------------------------------------------------------------------







const addToCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.query.id;

        if (!userId) {
            return res.redirect('/login');
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        let cart = await Cart.findOne({ userid: userId });
        if (!cart) {
            cart = new Cart({ userid: userId, items: [] });
        }

        const existingItem = cart.items.find((item) => item.productId.toString() === productId);

        // Redirect to cart if cart quantity equals product stock
        if (existingItem && existingItem.quantity === product.quantity) {
            return res.status(200).json({
                success: false,
                message: `The quantity in the cart equals the available stock of ${product.productName}.`,
                redirectUrl: '/getCart'
            });
        }
        

        if (existingItem) {
            // Check if the quantity limit (e.g., 5) is reached
            if (existingItem.quantity >= 5) {
                return res.status(200).json({
                    success: false,
                    message: 'Product quantity limit reached.',
                    redirectUrl: '/getCart'
                });
            }

            // Increment the cart quantity and update total price
            existingItem.quantity += 1;
            existingItem.totalPrice = existingItem.quantity * product.salePrice;

            
            
            
        } else {
            // Add a new item to the cart if it doesn't already exist
            cart.items.push({
                productId: product._id,
                quantity: 1,
                price: product.salePrice,
                totalPrice: product.salePrice,
            });

            
        }

        // Save the cart
        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Product added to cart.',
            redirectUrl: '/getCart'
        });

        //---------------------------
        
        // const cartCount = cart.items.length;

        // res.status(200).json({
        //     success: true,
        //     message: "Product added to cart successfully",
        //     cartCount: cartCount
        // });
        //-----------------------------
    } catch (error) {
        console.error('Error in addToCart:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};










//----------------------------------------------------------------------------------------
  

  
  


const deleteFromCart = async (req, res) => {
    try {
        const userId = req.session.user;

        if (!userId) {
            return res.redirect('/login');
        }

        const productId = req.query.id;

        const cart = await Cart.findOne({ userid: userId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.equals(productId));
        if (itemIndex === -1) {
            return res.status(404).json({ message: "Product not in cart" });
        }

        cart.items.splice(itemIndex, 1);
        await cart.save();

        res.redirect('/getCart')

        //--------------------------------------------------
        // const cartCount = cart ? cart.items.length : 0;

        // return res.status(200).json({
        //     success: true,
        //     message: "Product removed from cart",
        //     cartCount: cartCount
        // });
        //----------------------------------------------------
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred while removing the product" });
    }
};










//-----------------------------------------------------------------------------------------
 //original
  




const decQty = async (req, res) => {
    try {
        const userId = req.session.user; // Get user ID from session
        const productId = req.params.id; // Get product ID from route params

        // Find the user's cart
        const cart = await Cart.findOne({ userid: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        // Find the specific product in the cart
        const item = cart.items.find(item => item.productId.toString() === productId);
        if (!item) {
            return res.status(404).json({ success: false, message: "Product not found in cart." });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found in database." });
        }


        // Prevent decreasing the quantity below 1
        if (item.quantity <= 1) {
            return res.status(400).json({
                success: false,
                message: "Cannot decrease quantity below 1.",
            });
        }

        // Decrement quantity in the cart
        item.quantity -= 1;
        item.totalPrice = item.quantity * item.price;

        //updateCartCounter(false);

        await cart.save();

        // Recalculate cart's grand total
        const grandTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);

        res.json({
            success: true,
            updatedItem: {
                productId: item.productId,
                productName: product.productName,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
            },
            grandTotal,
        });
    } catch (error) {
        console.error("Error in decQty:", error);
        res.status(500).json({ success: false, message: "An error occurred while updating the cart." });
    }
};











//----------------------------------------------------------------------------------------




const incQty = async (req, res) => {
    try {
        const userId = req.session.user; // Get user ID from session
        const productId = req.params.id; // Get product ID from route params

        // Find the user's cart
        const cart = await Cart.findOne({ userid: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        // Find the specific product in the cart
        const item = cart.items.find(item => item.productId.toString() === productId);
        if (!item) {
            return res.status(404).json({ success: false, message: "Product not found in cart." });
        }

        // Fetch the product details from the database
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found in database." });
        }

        const productQtyOrdered = 5; // Define max quantity per product

        // Check stock availability
        const stockDifference = product.quantity - item.quantity;
        if (stockDifference <= 0) {
            product.status = "Out of stock";
            await product.save();

            return res.status(400).json({
                success: false,
                message: `${product.productName} is out of stock.`,
            });
        }

        // Enforce maximum purchase limit
        if (item.quantity >= productQtyOrdered) {
            return res.status(400).json({
                success: false,
                message: "You can purchase a maximum of 5 units for this product.",
            });
        }

        // Increment quantity in the cart
        item.quantity += 1;
        item.totalPrice = item.quantity * item.price;

        // Update product quantity and status
        //product.quantity -= 1;
        // if (product.quantity === 0) {
        //     product.status = "Out of stock"; 
        // } else {
        //     product.status = "Available"; 
        // }

        

        await product.save();
        await cart.save();

        // Recalculate cart's grand total
        const grandTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);

        res.json({
            success: true,
            updatedItem: {
                productId: item.productId,
                productName: product.productName,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
            },
            grandTotal,
        });
    } catch (error) {
        console.error("Error in incQty:", error);
        res.status(500).json({ success: false, message: "An error occurred while updating the cart." });
    }
};






//----------------------------------------------------------------------------------------------

const checkOutPage = async (req, res) => {
    try {
      const userId = req.session.user; // Retrieve user ID from session
  
      if (!userId) {
        return res.redirect("/login"); // Redirect if user is not logged in
      }

      const user = await User.findById(userId)
  
      // Fetch the user's cart data
      const cartData = await Cart.findOne({ userid : userId })
        .populate({
          path: "items.productId",
          model: "Product",
          select: "productName price productImage salePrice",
        })
        .lean();
  
      if (!cartData || !cartData.items.length) {
        return res.redirect("/shop"); // Redirect to shop if cart is empty
      }


       // Recalculate the grand total
       let grandTotal = 0;
       cartData.items.forEach(item => {
           const product = item.productId;
           if (product) {
               const itemTotal = item.quantity * product.salePrice;
               grandTotal += itemTotal;
           }
       });


  
      // Fetch user's saved addresses
      const addressData = await Address.findOne({ userId }).lean();
  
      if (!addressData || !addressData.address.length) {
        return res.status(404).render("add-address", {
          message: "No saved addresses found. Please add an address first.",
        });
      }
  


    // Calculate the final amount (Grand total + shipping cost)
    const shippingCost = 0;  // Free shipping as per your logic
    let finalAmount = grandTotal + shippingCost;


    
    //--------------------------------------------------------------------------------
    //req.session.grandTotal= finalAmount
    req.session.finalAmount = finalAmount;
//------------------------------







//------------------------------
    res.render("checkout", {
        userId,
        addressData: addressData.address,
        cartData,
        grandTotal,  // Subtotal
        finalAmount,  // Total price including shipping
        shippingCost: 0,  // Free shipping (as per your logic)
        
        couponApplied: req.session.couponApplied,
        walletBalance : user.wallet,
        couponName: req.session.couponName,
        discountAmount: req.session.discountAmount,
    });



    } catch (error) {
      console.error("Error in rendering checkout page:", error.message,error.stack);
      res.redirect('/pageNotFound')
    }
  };




  


const updateAddress = async (req, res) => {
    try {
      const userId = req.session.user; // Assuming user ID is available from authentication middleware
      const addressId = req.query.id; // Get the address ID from the query parameters
  
      //console.log("UserId :",userId);
      //console.log("addressId :",addressId);
      
      console.log("Address ID from query:", addressId);
      const updatedData = {
        "address.$.addressType": req.body.addressType,
        "address.$.name": req.body.name,
        "address.$.city": req.body.city,
        "address.$.landMark": req.body.landMark,
        "address.$.state": req.body.state,
        "address.$.pincode": req.body.pinCode,
        "address.$.phone": req.body.phoneNumber,
        "address.$.altPhone": req.body.altPhone,
      };
  
      // Update the specific address in the user's address array
      const updatedUser = await Address.findOneAndUpdate(
        { userId, "address._id": addressId }, // Match user ID and address ID
        { $set: updatedData }, // Update the specific address in the array
        { new: true, runValidators: true } // Return the updated document and validate input
      );

      

      

  
      if (!updatedUser) {
        return res.status(404).send("Address not found.");
      }
  

      res.redirect("/checkout?success=true");
    } catch (error) {
      console.error("Error updating address:", error.message, error.stack);
      res.redirect("/pageNotFound");
    }
  };



  

  const deleteAddress = async(req,res)=>{
    try {
        const addressId = req.query.id;
        const findAddress = await Address.findOne({'address._id' : addressId}) 
        if(!findAddress){
            return res.status(404).send("Address not found")
        }
        await Address.updateOne({
            "address._id" : addressId
        },
        {
            $pull:{
                address : {
                    _id : addressId,
                }
            }
        }
    
    )

    res.redirect('/checkout?isDeleted=true');
        
    } catch (error) {
        console.error("Error in delete address",error);
        res.redirect('/pageNotFound')
        
    }
}







const confirmAddress = async (req, res) => {
    try {
      const { selectedAddress } = req.body;
      const userId = req.session.user;
  
      if (!userId) {
        return res.status(401).json({ message: 'Please log in to continue.' });
      }
  
      if (!selectedAddress) {
        return res.status(400).json({ message: 'Please select an address for your order.' });
      }
  
      const addressData = await Address.findOne({
        userId,
        'address._id': selectedAddress,
      });
  
      if (!addressData) {
        return res.status(404).json({ message: 'Invalid address. Please select a valid address.' });
      }
  
      const selectedAddressDetails = addressData.address.find(
        (address) => address._id.toString() === selectedAddress
      );
  
      req.session.selectedAddress = selectedAddressDetails;
  
      res.status(200).json({ message: 'Address selected successfully!' });
    } catch (error) {
      console.error('Error confirming address:', error);
      res.status(500).json({ message: 'An error occurred while selecting the address.' });
    }
  };

  


  



const selectPaymentType = async (req, res) => {
    try {
      const { paymentType } = req.body; // Extract the payment type from the request body
      const userId = req.session.user; // Get the logged-in user's ID
  
      // Validate the user is logged in
      if (!userId) {
        return res.status(401).json({ message: 'Please log in to continue.' });
      }
  
      // Validate the selected payment type
      if (!['COD', 'Wallet', 'Razorpay'].includes(paymentType)) {
        return res.status(400).json({ message: 'Please select a valid payment type.' });
      }
  
      // Save the payment type in the session
      req.session.paymentType = paymentType;
  
      // Respond with a success message
      res.status(200).json({ message: 'Payment type selected successfully!' });
    } catch (error) {
      console.error('Error selecting payment type:', error);
      res.status(500).json({ message: 'An error occurred while selecting the payment type.' });
    }
  };
  
  
  












//-------------------------------------------------------------------------------


//original


// const orderPlaced = async (req, res) => {
//     try {
//         //console.log("Starting orderPlaced controller...");

//         // Validate user session
//         const userId = req.session.user;
//         if (!userId) {
//             console.log("User is not logged in. Redirecting to login...");
//             return res.redirect('/login');
//         }

//         // Fetch cart data and populate product details
//         const cartData = await Cart.findOne({ userid: userId }).populate('items.productId');

//         if (!cartData || cartData.items.length === 0) {
//             console.log("Cart is empty. Redirecting to shop...");
//             return res.redirect('/shop');
//         }

//         // Fetch user's address
//         const addressData = await Address.findOne({ userId });

//         if (!addressData || addressData.address.length === 0) {
//             console.log("No addresses found. Redirecting to add-address...");
//             return res.redirect('/add-address');
//         }

//         // Use the selected address from session
//         const selectedAddress = req.session.selectedAddress;
//         const paymentType = req.session.paymentType;

//         // Prepare ordered items
//         const orderedItems = cartData.items.map((item) => ({
//             product: item.productId._id,
//             quantity: item.quantity,
//             price: item.productId.salePrice || item.price,
//         }));

//         // Calculate total price and final amount
//         const totalPrice = orderedItems.reduce(
//             (total, item) => total + item.price * item.quantity,
//             0
//         );
//         const discount = req.session.discountAmount || 0;
//         const couponName = req.session.couponName || "No Coupon Applied";
//         //const finalAmount = totalPrice - discount;
//        const finalAmount =  totalPrice - discount;

//        //console.log("Coupon name :",couponName);

//        //--------------------------------------

//        req.session.finalAmount = finalAmount
//        //--------------------------------------
       

//         // Update product quantities
//         for (const item of cartData.items) {
//             const product = item.productId;
//             if (product.quantity < item.quantity) {
//                 console.log(`Not enough stock for ${product.productName}.`);
//                 return res.status(400).send('Insufficient stock for one or more items.');
//             }
//             product.quantity -= item.quantity;

//             // Update product status if necessary
//             if (product.quantity === 0) {
//                 product.status = "Out of stock";
//             } else {
//                 product.status = "Available";
//             }

//             try {
//                 await product.save();
//             } catch (err) {
//                 console.error(`Failed to save product ${product.productName}:`, err);
//                 return res.status(500).send('Error updating product stock.');
//             }
//         }

//         let order;

//         if(paymentType === "COD"){
//         // Create the order
//          order = await Order.create({
//             userId,
//             orderedItems,
//             totalPrice,
//             discount,      
//             couponName,
//             finalAmount,
//             address: selectedAddress,
//             status: 'Pending',
//             invoiceDate: new Date(),
//             createdOn: new Date(),
//             couponApplied: !!req.session.couponApplied,
//             paymentType: paymentType,
//         });

//         req.session.currentOrder = { _id: order._id }; // Store order ID in session

//         const newOrder = new Order(order)
//         await newOrder.save();

//         //console.log("new order",newOrder);

//     }else if(paymentType === "Razorpay"){
//         order = req.session.razorpayOrder;

//     }
        

//         delete req.session.selectedAddress;

//         // Clear the cart
//         await Cart.deleteOne({ userid: userId });

//         // Render the order success page
//         res.render('orderSuccess', {
//             user: req.session.currentUser,
//             order : req.session.currentOrder, // Pass the order from session ,
//             cartData: cartData.items,
//             addressData: selectedAddress,
//         });
//         console.log("Order success page rendered.");

//     } catch (error) {
//         console.error("Error in orderPlaced controller:", error);
//         res.redirect('/pageNotFound'); // Redirect to an error page on failure
//     }
// };




//--------------------------------------








const orderPlaced = async (req, res) => {
    try {
        const userId = req.session.user;
        if (!userId) return res.redirect('/login');

        const cartData = await Cart.findOne({ userid: userId }).populate('items.productId');
        if (!cartData || cartData.items.length === 0) return res.redirect('/shop');

        const addressData = await Address.findOne({ userId });
        if (!addressData || addressData.address.length === 0) return res.redirect('/add-address');

        const selectedAddress = req.session.selectedAddress;
        const paymentType = req.session.paymentType;

        const orderedItems = cartData.items.map(item => ({
            product: item.productId._id,
            quantity: item.quantity,
            price: item.productId.salePrice || item.price,
        }));

        const totalPrice = orderedItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
        const discount = req.session.discountAmount || 0;
        const finalAmount = totalPrice - discount;

        // Update stock for each product
        for (const item of orderedItems) {
            const product = await Product.findById(item.product);
            if (!product || product.quantity < item.quantity) {
                return res.status(400).send('Insufficient stock for some products.');
            }

            product.quantity -= item.quantity;


            product.salesCount += item.quantity;
            const categoryId = product.category;
            const brand  = product.brand;

            await Category.findByIdAndUpdate(categoryId ,{
                $inc :{totalSales : item.quantity}
            })

            await Brand.findOneAndUpdate({brandName : brand }, {
                $inc : {totalSales : item.quantity}
            })

            if (product.quantity === 0) product.status = "Out of stock";
            await product.save();
        }

        if (paymentType === "COD") {
            const order = await Order.create({
                userId,
                orderedItems,
                totalPrice,
                discount,
                couponName: req.session.couponName || "No Coupon Applied",
                finalAmount,
                address: selectedAddress,
                status: 'Pending',
                paymentType: "COD",
                couponApplied: discount > 0 // Set couponApplied to true if discount is applied
            });

            delete req.session.selectedAddress;
            
            delete req.session.couponApplied;
            delete req.session.couponName;
            delete req.session.discountAmount;

            await Cart.deleteOne({ userid: userId });

            req.session.currentOrder = { _id: order._id };

            

            res.render('orderSuccess', {
                user: req.session.currentUser,
                order: req.session.currentOrder,
                cartData: cartData.items,
                addressData: selectedAddress,
            });

            
            //delete  req.session.currentOrder;


        } else {
            res.status(400).send('Invalid payment type.');
        }
    } catch (error) {
        console.error("Error in orderPlaced controller:", error);
        res.redirect('/pageNotFound');
    }
};








//-----------------------------------------------------


const applyCoupon = async (req, res) => {
    try {
        const { name } = req.body; // Coupon name provided by the user
        const userId = req.session.user; // Fetch userId from the session
        //console.log("userId :",req.session.user);
        

        // Get the current cart with latest values
         const cartData = await Cart.findOne({ userid: userId }).populate('items.productId');

         //console.log("cartData :",cartData);
         
        
         if (!cartData || !cartData.items.length) {
            return res.json({
                success: false,
                message: "Your cart is empty. Add products to apply the coupon.",
            });
        }


        // Recalculate the grand total from cart data
        let newtotal = 0;
        cartData.items.forEach(item => {
            const product = item.productId;
            if (product) {
                const itemTotal = item.quantity * product.salePrice;
                newtotal += itemTotal;
            }
        });
        req.session.grandTotal = newtotal; // Update session with recalculated grand 


        // 1. Fetch coupon data from the database
        const couponData = await Coupon.findOne({ name, isList: true }); // Check if coupon is listed
        if (!couponData) {
            return res.json({
                success: false,
                message: "Coupon does not exist or is not active.",
            });
        }

        // 2. Validate conditions: minimumPrice and expiry
        const grandTotal = parseFloat(req.session.grandTotal); // Current cart total
        const minimumPrice = parseFloat(couponData.minimumPrice);
        const isExpired = new Date() > new Date(couponData.expiredOn);

        //console.log("grandTotal :",grandTotal);
        //console.log("Final amount :",finalAmount);
        

        

        if (grandTotal < minimumPrice) {
            return res.json({
                success: false,
                message: `Your total must be at least ₹${minimumPrice} to apply this coupon.`,
            });
        }

        if (isExpired) {
            return res.json({
                success: false,
                message: "This coupon has expired.",
            });
        }

        // 3. Check if coupon is already used by the user (optional)
        if (couponData.userid && couponData.userid.toString() === userId) {
            return res.json({
                success: false,
                message: "You have already used this coupon.",
            });
        }

       
        // 4. Apply coupon discount
        
            const discountAmount = parseFloat(couponData.offerPrice);
        const  grandTotalAfterDiscount = grandTotal - discountAmount;


        //--------------------------------------------------

        
        //--------------------------------------------------
        

        
        // 5. Update session details
        // req.session.grandTotal = grandTotalAfterDiscount;
         req.session.couponApplied = true;
         req.session.couponName = couponData.name;
         req.session.discountAmount = discountAmount;

        // (Optional) Save userId to coupon to mark it as used
        couponData.userid = userId;
        await couponData.save();

        // 6. Success response
        res.json({
            success: true,
            message: "Coupon applied successfully!",
            discountAmount,
            grandTotalAfterDiscount,
        });

        // console.log("Coupon applied:", {
        //     couponName: name,
        //     discountAmount,
        //     grandTotalAfterDiscount,
        //     originalTotal: grandTotal,
        // });

    } catch (error) {
        console.error("Error in applyCoupon:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error. Please try again later.",
        });
    }
};





// const removeCoupon = async (req, res) => {
//     try {
//         // Reset session values related to the coupon
//         req.session.couponApplied = false;
//         req.session.couponName = null;
//         req.session.discountAmount = 0;

//         // Get user ID from the session
//         const userId = req.session.user._id || req.session.user;

//         // Fetch the cart data to recalculate the grand total
//         const cartData = await Cart.find({ userId }).populate('productId');

//         let grandTotal = 0;
//         cartData.forEach(item => {
//             grandTotal += item.productId.salePrice * item.productQty;
//         });

//         // Update session with the recalculated grand total
//         req.session.grandTotal = grandTotal;

//         // If there's a current order, update it to reflect coupon removal
//         if (req.session.currentOrder && req.session.currentOrder._id) {
//             await Order.findByIdAndUpdate(req.session.currentOrder._id, {
//                 $set: {
//                     couponApplied: false,
//                     couponName: null,
//                     discountAmount: 0,
//                     finalAmount: grandTotal, // Ensure `finalAmount` is reverted
//                 }
//             });
//         }

//         //console.log("req.session.currentOrder :",req.session.currentOrder._id);
        

//         // Respond with success and the new grand total
//         res.json({
//             success: true,
//             message: 'Coupon removed successfully',
//             newTotal: grandTotal
//         });
//     } catch (error) {
//         console.error('Error removing coupon:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error removing coupon'
//         });
//     }
// };



const removeCoupon = async (req, res) => {
    try {
        // Check if a coupon is applied
        if (!req.session.couponApplied) {
            return res.json({
                success: false,
                message: "No coupon is applied to remove.",
            });
        }

        // Clear all coupon-related data from the session
        delete req.session.couponApplied;
        delete req.session.couponName;
        delete req.session.discountAmount;

        // Recalculate the grand total without the discount
        const userId = req.session.user;
        const cartData = await Cart.findOne({ userid: userId }).populate('items.productId');

        if (!cartData || !cartData.items.length) {
            req.session.grandTotal = 0; // Set grand total to 0 if the cart is empty
        } else {
            let newTotal = 0;
            cartData.items.forEach(item => {
                const product = item.productId;
                if (product) {
                    const itemTotal = item.quantity * product.salePrice;
                    newTotal += itemTotal;
                }
            });
            req.session.grandTotal = newTotal; // Update grand total in the session
        }

        // Send a success response
        res.json({
            success: true,
            message: "Coupon removed successfully.",
            grandTotal: req.session.grandTotal,
        });

    } catch (error) {
        console.error("Error in removeCoupon:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error. Please try again later.",
        });
    }
};





//---------------------------------------------------------------

//original 

const createRazorpayOrder = async (req, res) => {
    //console.log("req.body from razorpay",req.body);
    
    try {


        if (!req.body.amount) {
            return res.status(400).json({ error: 'Amount is required' });
          }
      
          const discountAmount = req.session.discountAmount || 0; // Default to 0 if undefined
          const amountInPaise = req.body.amount - (discountAmount * 100);
      
          if (amountInPaise <= 0) {
            return res.status(400).json({ error: 'Invalid amount after discount' });
          }
      


          const options = {
            amount: parseInt(req.body.amount - (discountAmount * 100)),
            currency: 'INR',
            receipt: 'order_' + Date.now(),
        };

        //console.log("options:",options);
        

        //console.log("Amount :",options.amount);
        

        
        const order = await razorpay.orders.create(options);

            

        //console.log("order :",order);
        

        //res.json(order);

        res.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
            order: order
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Error creating order' });
    }
};

//------------------------------------------------------



const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature,orderId } = req.body;

        // Verify Razorpay signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        const isPaymentVerified = razorpay_signature === expectedSign;

        const existingOrder = await Order.findById(orderId);
        // if(existingOrder && existingOrder.paymentStatus === "Pending"){
        //     existingOrder.paymentStatus = "Completed";
        //     await existingOrder.save();
        // }

        
        // Fetch user, cart, and session data
        const userId = req.session.user;
        const cartData = await Cart.findOne({ userid: userId }).populate('items.productId');

        // Proceed even if cartData is missing
        if (!cartData || cartData.items.length === 0) {
            console.error('Cart is empty. Creating order with no items.');
        }

        const selectedAddress = req.session.selectedAddress || null;
        const discountAmount = req.session.discountAmount || 0;
        const couponName = req.session.couponName || "No Coupon Applied";

        const orderedItems = cartData ? cartData.items.map(item => ({
            product: item.productId._id,
            quantity: item.quantity,
            price: item.productId.salePrice,
        })) : [];

        const totalPrice = orderedItems.reduce((total, item) =>
            total + (item.price * item.quantity), 0);
        const finalAmount = totalPrice - discountAmount;


        if(existingOrder && existingOrder.paymentStatus === "Pending"){
            existingOrder.paymentStatus = "Completed";
            await existingOrder.save();
        }else{

        // Create order in the database
        const order = await Order.create({
            userId,
            orderedItems,
            totalPrice,
            discount: discountAmount,
            couponName,
            finalAmount,
            address: selectedAddress,
            status: 'Pending',
            paymentType: "Razorpay",
            paymentStatus: isPaymentVerified ? "Completed" : "Pending",
            couponApplied: discountAmount > 0 // Set to true if a discount was applied
        });

        req.session.currentOrder = order;

    
        

        // Update stock only if payment is verified
        if (isPaymentVerified) {

            

            for (const item of orderedItems) {
                const product = await Product.findById(item.product);
                if (product && product.quantity >= item.quantity) {
                    product.quantity -= item.quantity;
                    product.salesCount += item.quantity;

                    const categoryId = product.category;
                    const brand = product.brand;

                    await Category.findByIdAndUpdate(categoryId, {
                        $inc: { totalSales: item.quantity }
                    });

                    await Brand.findOneAndUpdate(
                        { brandName: brand },
                        { $inc: { totalSales: item.quantity } }
                    );

                    if (product.quantity === 0) product.status = "Out of stock";
                    await product.save();
                }
            }
        }

        delete req.session.couponApplied;
delete req.session.discountAmount;
delete req.session.couponName;

        // Send appropriate response
        return res.status(200).json({
            success: isPaymentVerified,
            message: isPaymentVerified ? 'Payment verified successfully' : 'Payment verification failed. Order created with Pending status.',
            orderId: order._id,
        });
    }
    } catch (error) {
        console.error('Error verifying payment:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
};



//---------------------------------------------------------------------------------------------------------------------




const orderPlacedRzpy = async(req,res)=>{
    try {

        if (!req.session.currentOrder) {
            return res.redirect('/shop'); 
          }

          const userId = req.session.user;
        const cartData = await Cart.findOne({ userid: userId }).populate('items.productId');

        //console.log("cartdata :",cartData);
        
        if (!cartData || cartData.items.length === 0) {
            return res.status(400).json({ success: false, error: 'Cart is empty. Redirecting to shop.' });
        }

          const { currentOrder } = req.session;

            res.render('orderSuccess', {
                user: req.session.user,
                cartData: cartData ? cartData.items : [],
                order: currentOrder,
            });

            await Cart.deleteOne({ userid: userId });
            delete req.session.currentOrder;
            
            // Clear cart and session data
        
        delete req.session.discountAmount;
        delete req.session.couponName;
        delete req.session.selectedAddress;
            
            
    } catch (error) {
        console.error("error message:",error);
        
        
    }
}






//--------------------------------------------------------------




const processWalletPayment = async (req, res) => {
    try {
        //console.log("Starting process wallet controller...");

        // Validate user session
        const userId = req.session.user;
        if (!userId) {
            console.log("User is not logged in. Redirecting to login...");
            return res.redirect('/login');
        }

        // Fetch cart data and populate product details
        const cartData = await Cart.findOne({ userid: userId }).populate('items.productId');
        if (!cartData || cartData.items.length === 0) {
            console.log("Cart is empty. Redirecting to shop...");
            return res.redirect('/shop');
        }

        // Fetch user's address
        const addressData = await Address.findOne({ userId });
        if (!addressData || addressData.address.length === 0) {
            console.log("No addresses found. Redirecting to add-address...");
            return res.redirect('/add-address');
        }

        // Use the selected address from session
        const selectedAddress = req.session.selectedAddress;

        // Prepare ordered items
        const orderedItems = cartData.items.map((item) => ({
            product: item.productId._id,
            quantity: item.quantity,
            price: item.productId.salePrice || item.price,
        }));

        // Calculate total price
        const totalPrice = orderedItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        //Handle coupon logic
        let discount = 0;
        let couponName = "No Coupon Applied";

        if (req.session.couponApplied) {
            discount = req.session.discountAmount || 0; // Use the discount amount from session
            couponName = req.session.couponName || "No Coupon Applied"; // Set the coupon name
        } else {
            // Clear coupon-related session data if no coupon is applied
            discount = 0;
            couponName = "No Coupon Applied";
            req.session.discountAmount = 0;
            req.session.couponName = null;
            req.session.couponApplied = false;
        }

        // Calculate the final amount after applying discount
        const finalAmount = totalPrice - discount;

        //console.log("Final Amount:", finalAmount, "Coupon Name:", couponName);

        // Update product quantities
        for (const item of cartData.items) {
            const product = item.productId;
            if (product.quantity < item.quantity) {
                console.log(`Not enough stock for ${product.productName}.`);
                return res.status(400).send('Insufficient stock for one or more items.');
            }
            product.quantity -= item.quantity;

            // Update product status if necessary
            product.status = product.quantity === 0 ? "Out of stock" : "Available";


            //

            product.salesCount += item.quantity;
            const categoryId = product.category;
            const brand  = product.brand;

            //console.log("sales count :"+product.salesCount+", "+"categoryId :"+categoryId+", "+"brand :"+brand);
            
            await Category.findByIdAndUpdate(categoryId ,{
                $inc :{totalSales : item.quantity}
            })

            await Brand.findOneAndUpdate({brandName  : brand}, {
                $inc : {totalSales : item.quantity}
            })

            if (product.quantity === 0) product.status = "Out of stock";
            await product.save();
            //



            // try {
            //     await product.save();
            // } catch (err) {
            //     console.error(`Failed to save product ${product.productName}:`, err);
            //     return res.status(500).send('Error updating product stock.');
            // }
        }

        // Create and save the order
        const order = await Order.create({
            userId,
            orderedItems,
            totalPrice,
            discount,
            couponName,
            finalAmount,
            address: selectedAddress,
            status: 'Pending',
            invoiceDate: new Date(),
            createdOn: new Date(),
            couponApplied: !!req.session.couponApplied,
            paymentType: "Wallet",
            paymentStatus : "Completed"
        });

        req.session.currentOrder = { _id: order._id };

        // Validate the order ID
        const orderId = req.session.currentOrder._id;
        if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
            console.error('Invalid Order ID:', orderId);
            return res.status(400).send('Invalid Order ID');
        }

        // Fetch the user
        const user = await User.findById(userId);
        if (!user || user.wallet < finalAmount) {
            return res.status(400).send('Insufficient wallet balance');
        }

        // Deduct the amount from the wallet
        user.wallet -= finalAmount;

        // Record the transaction
        const transaction = new Wallet({
            userId: order.userId,
            amount: finalAmount,
            status: 'Debited',
            description: `Debited for purchased order #${order._id}`,
        });
        await transaction.save();

        // Save transaction to wallet history
        user.walletHistory = user.walletHistory || [];
        user.walletHistory.push(transaction._id);
        await user.save();

        // Clear the cart after processing
        await Cart.deleteOne({ userid: userId });

        // Render success page
        res.render("orderSuccess", {
            user: req.session.user,
            cartData: cartData ? cartData.items : [],
            order: {
                ...req.session.currentOrder,
                couponApplied: order.couponApplied,
                finalAmount: order.finalAmount,
                paymentType: order.paymentType,
                orderid: order._id,
            },
        });

        
            delete req.session.couponApplied;
            delete req.session.discountAmount;
            delete req.session.couponName;
        

    } catch (error) {
        console.error("Error processing wallet payment:", error);
        res.status(500).send('Error processing payment.');
    }
};



module.exports ={ 
    
    renderCartPage,
    addToCart,
    deleteFromCart,
    decQty,
    incQty,
    checkOutPage,
    updateAddress,
    deleteAddress,
    confirmAddress,
    orderPlaced,
    selectPaymentType,
    applyCoupon,
    removeCoupon,
    createRazorpayOrder,
    verifyPayment,
    processWalletPayment,
    orderPlacedRzpy

    
}



