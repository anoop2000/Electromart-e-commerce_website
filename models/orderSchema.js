const mongoose  = require('mongoose') 
const {Schema} = mongoose

const {v4:uuidv4} = require('uuid')
const { sendOrderStatusEmail } = require('../utils/sendOrderEmail'); 

const orderSchema = new Schema({
    orderid : {
        type : String,
        default : ()=> uuidv4(), // Automatically generates a unique ID
        unique : true
    },
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    orderedItems : [{

        product : {
            type : Schema.Types.ObjectId,
            ref : "Product",
            required : true
        },
        quantity : {
            type : Number,
            required : true 
        },
        price : {
            type : Number,
            default : 0,
            
        },
        
    }],
    totalPrice :{
        type : Number,
        required : true
    },
    discount : {
        type : Number,
        default : 0
    },
    finalAmount : {
        type : Number,
        required : true
    },
    address : {
        type : Schema.Types.ObjectId,
        ref : "Address",
        required : true


        
    },
    orderDate : {
        type : Date,
        required: true,
        default: Date.now
    },
    status : {
        type : String,
        required : true,
        enum : ["Pending","Shipped","Delivered","Cancelled","Returned"]

    },cancellationReason : {
        type : String,
        default : "none",
        
    },
    createdOn : {
        type : Date,
        default : Date.now,
        required : true
    },
    couponApplied : {
        type : Boolean,
        default : false
    },paymentType: {
        type: String, 
        enum: ["COD","Wallet","Razorpay"]
        // default : 'toBeChosen'
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
        default: 'Pending'
    }
    

    
},{timestamps : true})




orderSchema.pre('save', async function(next) {
    try {
        // Only send email if status is changed
        if (this.isModified('status')) {
            // Populate user details
            await this.populate('userId');
            
            // Send status email
            await sendOrderStatusEmail(this, this.userId);
        }
        next();
    } catch (error) {
        console.error('Error in order pre-save middleware:', error);
        next(error);
    }
});

const Order = mongoose.model("Order",orderSchema)

module.exports  = Order

