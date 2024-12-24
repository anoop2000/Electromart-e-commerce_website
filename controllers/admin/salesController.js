const Order = require("../../models/orderSchema");
const { generatePDF, generateExcel } = require('../../utils/reportUtils.js');

const getReport = async(req,res)=>{
    try {
      res.render('sales')
    } catch (error) {
      console.log(error);
      
    }
}




const generateSalesReport = async (req, res) => {
    const { reportType, startDate, endDate, downloadFormat } = req.body;
    //console.log("req.body from salescontroller", req.body);

    try {
        // Base query for fetching orders with 'Delivered' status
        let query = { status: 'Delivered' };

        // Apply date filters based on the selected report type
        if (reportType === 'custom') {
            query.createdOn = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else if (reportType === 'daily') {
            const today = new Date();
            query.createdOn = { $gte: new Date(today.setHours(0, 0, 0, 0)) };
        } else if (reportType === 'weekly') {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - 7);
            query.createdOn = { $gte: weekStart };
        } else if (reportType === 'monthly') {
            const monthStart = new Date();
            monthStart.setMonth(monthStart.getMonth() - 1);
            query.createdOn = { $gte: monthStart };
        } else if (reportType === 'yearly') {
            const yearStart = new Date();
            yearStart.setFullYear(yearStart.getFullYear() - 1);
            query.createdOn = { $gte: yearStart };
        }

        // Fetch orders based on the query, populating required references
        const orders = await Order.find(query)
            .populate('userId', 'name email') // Include user details
            .populate('orderedItems.product', 'name price') // Include product details
            .populate('address', 'addressType name landMark city state pincode phone'); // Include address details
        
        //console.log("orders:", orders);

        // Calculate total sales count, total order amount, discounts, and coupon deductions
        const totalSalesCount = orders.length;
        const totalOrderAmount = orders.reduce((sum, order) => sum + order.totalPrice, 0);
        const totalDiscount = orders.reduce((sum, order) => sum + order.discount, 0);
        const totalCouponDeduction = orders.reduce((sum, order) => sum + (order.couponApplied ? order.discount : 0), 0);

        // Prepare the report data
        const reportData = {
            totalSalesCount,
            totalOrderAmount,
            totalDiscount,
            totalCouponDeduction,
            orders: orders.map(order => ({
                orderId: order.orderid,
                user: order.userId,
                items: order.orderedItems.map(item => ({
                    productName: item.product.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
                totalPrice: order.totalPrice,
                discount: order.discount,
                finalAmount: order.finalAmount,
                paymentType: order.paymentType,
                createdOn: order.createdOn,
                invoiceDate: order.invoiceDate,
                address: order.address,
            })),
        };

        if (downloadFormat === 'pdf') {
            // Generate and download PDF if requested
            const { pdfBuffer, filename } = await generatePDF(reportData, reportType);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=${filename}`,
            });
            res.send(pdfBuffer);
        } else if (downloadFormat === 'excel') {
            // Generate and download Excel if requested
            const excelBuffer = await generateExcel(reportData);
            res.set({
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename=sales_report.xlsx',
            });
            res.send(excelBuffer);
        } else {
            // Return report data as JSON for rendering in the frontend
            res.json(reportData);
        }
    } catch (error) {
        console.error('Error generating sales report:', error);
        res.status(500).send('Error generating report');
    }
};






module.exports = {
    getReport,
    generateSalesReport
}