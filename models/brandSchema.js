const mongoose  = require('mongoose')
const {Schema} = mongoose

const brandSchema = new Schema({

    brandName :{
        type : String,
        unique : true,
        index : true,
        required : true
    },
    brandImage : {
        type : [String],
        required : true
    },
    isBlocked :{
        type : Boolean,
        default : false
    },
    totalSales:{
        type: Number,
        required : true,
        default: 0
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
})

const Brand = mongoose.model("Brand",brandSchema)

module.exports = Brand