const Product = require('../../models/productSchema')
const Category = require('../../models/categorySchema')
const User  =  require('../../models/userSchema')


// const productDetails = async(req,res)=>{
//     try {
//         const userId = req.session.user;
//         const userData = await User.findById(userId)
//         const productId = req.query.id;
//         const product = await Product.findById(productId).populate('category')
//         const findCategory = product.category;

//         const categoryOffer = findCategory?.categoryOffer || 0;
//         const productOffer = product.productOffer || 0
//         // const totalOffer = categoryOffer + productOffer;
//         const totalOffer = Number(categoryOffer) + Number(productOffer);


        
//         // console.log("User ID:", userId);
//         // console.log("Product ID:", productId);
//         // console.log("Fetched Product:", product);

        

//         res.render('product-details',{
//             user : userData,
//             product: product,
//             quantity : product.quantity,
//             totalOffer : totalOffer,
//             category : findCategory

//         })


        
//     } catch (error) {
//         console.error("Error for fetching product details",error);
//         res.redirect('/pageNotFound')
        
        
//     }
// }


//----------------------------------------------------------------



const productDetails = async (req, res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);

        const productId = req.query.id;
        const product = await Product.findById(productId).populate('category');
        const findCategory = product.category;

        const categoryOffer = findCategory?.categoryOffer || 0;
        const productOffer = product.productOffer || 0;
        const totalOffer = Number(categoryOffer) + Number(productOffer);

        // Fetch related products based on the category
        const relatedProducts = await Product.find({
            category: findCategory._id, // Match the same category
            _id: { $ne: productId }    // Exclude the current product
        }).limit(4); // Limit the number of related products

        res.render('product-details', {
            user: userData,
            product: product,
            quantity: product.quantity,
            totalOffer: totalOffer,
            category: findCategory,
            relatedProducts: relatedProducts // Pass related products to the view
        });

    } catch (error) {
        console.error("Error fetching product details:", error);
        res.redirect('/pageNotFound');
    }
};






module.exports= {
    productDetails,
    
}