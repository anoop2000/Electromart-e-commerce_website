const Order = require("../../models/orderSchema");
const { generatePDF, generateExcel } = require('../../utils/reportUtils.js');

const getReport = async(req,res)=>{
    try {
      res.render('sales')
    } catch (error) {
      console.log(error);
      
    }
}


module.exports = {
    getReport
}