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
        return res.status(404).render("error", {
          message: "No saved addresses found. Please add an address first.",
        });
      }
  





    // Get the grand total from the session
    //const grandTotal = req.session.grandTotal || 0;  // Default to 0 if not found in session

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




  const updateAddress = async(req,res)=>{
    try {

        const addressId = req.query.id; // Get the address ID from the query parameters
    const updatedData = {
      addressType: req.body.addressType,
      name: req.body.name,
      city: req.body.city,
      landMark: req.body.landMark,
      state: req.body.state,
      pincode: req.body.pinCode,
      phone: req.body.phoneNumber,
      altPhone: req.body.altPhone,
    };

    // Find the address by ID and update it with the new data
    const updatedAddress = await Address.findByIdAndUpdate(addressId, updatedData, {
      new: true, // Return the updated document
      runValidators: true, // Validate the input data
    });

    if (!updatedAddress) {
      return res.status(404).send('Address not found.');
    }

    // Redirect or respond after a successful update
    res.redirect('/checkout'); 

        
    } catch (error) {

        console.error('Error updating address:', error.message,error.stack);
    res.redirect('/pageNotFound')
        
    }
  }
  










module.exports ={ 
    
    renderCartPage,
    addToCart,
    deleteFromCart,
    decQty,
    incQty,
    checkOutPage,
    updateAddress
    
}



