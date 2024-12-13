const mongoose  = require('mongoose') 
const {Schema} = mongoose

const {v4:uuidv4} = require('uuid')

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
    invoiceDate : {
        type : Date,

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
    }
    

    
})

const Order = mongoose.model("Order",orderSchema)

module.exports  = Order

