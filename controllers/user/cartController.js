const Cart = require('../../models/cartSchema')
const Product = require('../../models/productSchema')
const User = require('../../models/userSchema')
const Address = require('../../models/addressSchema')
const Order = require('../../models/orderSchema')








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





const addToCart = async (req, res) => {
    try {
      const userId = req.session.user; // Get the logged-in user ID from the session
      const productId = req.query.id; // Get the product ID from the request parameters
  
      if (!userId) {
        return res.redirect('/login'); // Redirect to login if user is not logged in
      }
  
      // Find the product in the database
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).send('Product not found'); // Return error if product doesn't exist
      }
  
      // Find or create the user's cart
      let cart = await Cart.findOne({ userid: userId });
      if (!cart) {
        cart = new Cart({ userid: userId, items: [] });
      }
  
      // Check if the product already exists in the cart
      const existingItem = cart.items.find((item) => item.productId.toString() === productId);
  
      if (existingItem) {
        // Product exists in cart, update quantity and total price
        existingItem.quantity += 1;
        existingItem.totalPrice = existingItem.quantity * product.salePrice;
      } else {
        // Add new product to the cart
        cart.items.push({
          productId: product._id,
          quantity: 1,
          price: product.salePrice,
          totalPrice: product.salePrice,
        });
      }
  
      // Save the cart with updated data
      await cart.save();
  
      // Redirect back to the previous page
      res.redirect('/getCart');
    } catch (error) {
      console.error('Error in addToCart:', error);
      res.status(500).send('Internal Server Error');
    }
  };






    // if (existingItem) {
    //     // Check if adding another quantity exceeds stock
    //     if (existingItem.quantity + 1 > product.quantity) {
    //       return res.status(400).json({
    //         success: false,
    //         message: "Stock quantity is not sufficient!",
    //       });
    //     }
  
    //     // Update quantity and total price
    //     existingItem.quantity += 1;
    //     existingItem.totalPrice = existingItem.quantity * product.salePrice;
    //   } else {
    //     if (product.quantity < 1) {
    //       return res.status(400).json({
    //         success: false,
    //         message: "Stock quantity is not sufficient!",
    //       });
    //     }
  
    //     // Add new product to the cart
    //     cart.items.push({
    //       productId: product._id,
    //       quantity: 1,
    //       price: product.salePrice,
    //       totalPrice: product.salePrice,
    //     });
    //   }
  




  
      



  
  


  const deleteFromCart = async (req, res) => {
    try {
    const userId = req.session.user;

    if (!userId) {
        return res.redirect('/login');
    }

    const productId = req.query.id; 

    
    const cart = await Cart.findOne({ userid : userId });
    if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
    }

   
    const itemIndex = cart.items.findIndex(item => item.productId.equals(productId));
    if (itemIndex === -1) {
        return res.status(404).json({ message: "Product not in cart" });
    }

   
    cart.items.splice(itemIndex, 1);

    
    await cart.save();

    
    res.redirect('/getCart');
   } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while removing the product" });
    }
 };






  

const decQty = async (req, res) => {
    try {
      const userId = req.session.user; // Get user ID from session
      const productId = req.params.id; // Get product ID from the route params
  
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
  
      // Prevent decreasing the quantity below 1
      if (item.quantity <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot decrease quantity below 1.",
        });
      }
  
      // Update quantity and total price for the product
      item.quantity -= 1;
      item.totalPrice = item.quantity * item.price;
  
      // Save updated cart
      await cart.save();
  
      // Recalculate grand total for the cart
      const grandTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
  
      // Respond with updated values
      res.json({
        success: true,
        updatedItem: {
          productId: item.productId,
          productName: item.productId.productName || "Product", // Ensure productName is populated
          quantity: item.quantity,
          totalPrice: item.totalPrice,
        },
        grandTotal,
      });
    } catch (error) {
      console.error("Error in decQty:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while updating the cart.",
      });
    }
  };


//   const incQty = async (req, res) => {
//     try {
//       const userId = req.session.user; // Get user ID from session
//       const productId = req.params.id; // Get product ID from the route params
  
//       // Find the user's cart
//       const cart = await Cart.findOne({ userid: userId });
  
//       if (!cart) {
//         return res.status(404).json({ success: false, message: "Cart not found." });
//       }
  
//       // Find the specific product in the cart
//       const item = cart.items.find(item => item.productId.toString() === productId);
  
//       if (!item) {
//         return res.status(404).json({ success: false, message: "Product not found in cart." });
//       }
  
//       // Check if the quantity is at the maximum limit (8)
//       if (item.quantity >= 8) {
//         return res.status(400).json({
//           success: false,
//           message: "Maximum quantity of 8 items reached.",
//         });
//       }


//       // Find the product in the database to check stock
//     const product = await Product.findById(productId);

//     if (!product || item.quantity + 1 > product.quantity) {
//       return res.status(400).json({
//         success: false,
//         message: "Stock quantity is not sufficient!",
//       });
//     }



  
//       // Update quantity and total price for the product
//       item.quantity += 1;
//       item.totalPrice = item.quantity * item.price;
  
//       // Save updated cart
//       await cart.save();
  
//       // Recalculate grand total for the cart
//       const grandTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
  
//       // Respond with updated values
//       res.json({
//         success: true,
//         updatedItem: {
//           productId: item.productId,
//           productName: item.productId.productName || "Product", // Ensure productName is populated
//           quantity: item.quantity,
//           totalPrice: item.totalPrice,
//         },
//         grandTotal,
//       });
//     } catch (error) {
//       console.error("Error in incQty:", error);
//       res.status(500).json({
//         success: false,
//         message: "An error occurred while updating the cart.",
//       });
//     }
//   };



const incQty = async (req, res) => {
    try {
      const userId = req.session.user; // Get user ID from session
      const productId = req.params.id; // Get product ID from the route params
  
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
  
      // Check if the quantity is at the maximum limit (8)
      if (item.quantity >= 8) {
        return res.status(400).json({
          success: false,
          message: "Maximum quantity of 8 items reached.",
        });
      }
  
      // Update quantity and total price for the product
      item.quantity += 1;
      item.totalPrice = item.quantity * item.price;
  
      // Save updated cart
      await cart.save();
  
      // Recalculate grand total for the cart
      const grandTotal = cart.items.reduce((total, item) => total + item.totalPrice, 0);
  
      // Respond with updated values
      res.json({
        success: true,
        updatedItem: {
          productId: item.productId,
          productName: item.productId.productName || "Product", // Ensure productName is populated
          quantity: item.quantity,
          totalPrice: item.totalPrice,
        },
        grandTotal,
      });
    } catch (error) {
      console.error("Error in incQty:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while updating the cart.",
      });
    }
  };







const checkOutPage = async (req, res) => {
    try {
      const userId = req.session.user; // Retrieve user ID from session
  
      if (!userId) {
        return res.redirect("/login"); // Redirect if user is not logged in
      }
  
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
    const finalAmount = grandTotal + shippingCost;


    res.render("checkout", {
        userId,
        addressData: addressData.address,
        cartData,
        grandTotal,  // Subtotal
        finalAmount,  // Total price including shipping
        shippingCost: 0  // Free shipping (as per your logic)
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
  
  
  



  const orderPlaced = async (req, res) => {
    try {
        console.log("Starting orderPlaced controller...");
      
  
      // Validate user session
      const userId = req.session.user; // Adjust to the actual session field
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
  
      // Use the first address as the default address

      const selectedAddress = req.session.selectedAddress

      const paymentType = req.session.paymentType;
      
      
  
      // Prepare ordered items
      const orderedItems = cartData.items.map((item) => ({
        product: item.productId._id,
        quantity: item.quantity,
        price: item.productId.salePrice || item.price, // Ensure fallback to cart item price
      }));
      
  
      // Calculate total price and final amount
      const totalPrice = orderedItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
      const discount = req.session.couponDiscount || 0;
      const finalAmount = totalPrice - discount;
      
  
      // Create the order
      const order = await Order.create({
        userId,
        orderedItems,
        totalPrice,
        discount,
        finalAmount,
        address: selectedAddress, // Reference to the selected address
        status: 'Pending',
        invoiceDate: new Date(),
        createdOn: new Date(),
        couponApplied: !!req.session.couponApplied,
        paymentType : paymentType
      });

      delete req.session.selectedAddress;
      
  
      // Clear the cart
      await Cart.deleteOne({ userid: userId });
      
  
      // Render the order success page
      res.render('orderSuccess', {
        user: req.session.currentUser, // Ensure correct user data is passed
        order,
        cartData: cartData.items, // Pass only the items
        addressData: selectedAddress, // Pass the selected address
      });
      console.log("Order success page rendered.");
    } catch (error) {
      console.error("Error in orderPlaced controller:", error);
      res.redirect('/pageNotFound'); // Redirect to an error page on failure
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
    selectPaymentType
    
}



