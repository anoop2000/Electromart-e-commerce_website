



const getOrderStatusEmailTemplate = (order, user) => {
    const templates = {
        Pending: {
            subject: `Order #${order.orderid} Confirmed!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                        <h2 style="color: #333;">Order Confirmation</h2>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
                        <p>Hi ${user.name},</p>
                        <p>Your order #${order.orderid} has been confirmed!</p>
                        <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0;">
                            <p><strong>Order Details:</strong></p>
                            <p>Order Total: ₹${order.finalAmount}</p>
                            <p>Payment Method: ${order.paymentType}</p>
                            
                        </div>
                        <p>We'll notify you when your order ships.</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} ElectroMart. All rights reserved.</p>
                    </div>
                </div>
            `
        },
        Shipped: {
            subject: `Your Order #${order.orderid} Has Been Shipped!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                        <h2 style="color: #333;">Order Shipped</h2>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
                        <p>Hi ${user.name},</p>
                        <p>Great news! Your order #${order.orderid} is on its way.</p>
                        <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0;">
                            <p><strong>Shipping Details:</strong></p>
                            <p>Expected Delivery: Within 5 bussiness days</p>
                        </div>
                        <p>Track your order on our website.</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} ElectroMart. All rights reserved.</p>
                    </div>
                </div>
            `
        },
        Delivered: {
            subject: `Your Order #${order.orderid} Has Been Delivered!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                        <h2 style="color: #333;">Order Delivered</h2>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
                        <p>Hi ${user.name},</p>
                        <p>Your order #${order.orderid} has been delivered!</p>
                        <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0;">
                            <p>Thank you for shopping with ElectroMart.</p>
                            <p>We hope you enjoy your purchase!</p>
                        </div>
                        <p>If you have any questions about your order, please contact our support team.</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} ElectroMart. All rights reserved.</p>
                    </div>
                </div>
            `
        },
        Returned: {
            subject: `Order #${order.orderid} Return Confirmed`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                        <h2 style="color: #333;">Order Return Confirmed</h2>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
                        <p>Hi ${user.name},</p>
                        <p>Your return request for order #${order.orderid} has been confirmed.</p>
                        <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0;">
                            <p>We will process your return shortly.</p>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} ElectroMart. All rights reserved.</p>
                    </div>
                </div>
            `
        },
        Cancelled: {
            subject: `Order #${order.orderid} Cancellation Confirmed`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
                        <h2 style="color: #333;">Order Cancellation Confirmed</h2>
                    </div>
                    <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;">
                        <p>Hi ${user.name},</p>
                        <p>Your order #${order.orderid} has been cancelled as requested.</p>
                        <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0;">
                            <p>Any payment made will be refunded within 5-7 business days.</p>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} ElectroMart. All rights reserved.</p>
                    </div>
                </div>
            `
        }
    };

    return templates[order.status] || null;
};

module.exports = { getOrderStatusEmailTemplate };