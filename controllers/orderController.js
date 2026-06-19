const axios = require("axios");
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

exports.checkout = async (req, res) => {
    try {
        const userId = req.user.id;

        const cartItems = await Cart.findAll({
            where: { userId }
        });

        if (!cartItems.length) {
            return res.status(400).json({
                message: "Cart is empty"
            });
        }

        let totalAmount = 0;

        for (const item of cartItems) {
            const product = await Product.findByPk(item.productId);

            if (!product) continue;

            totalAmount += product.price * item.quantity;
        }

        const order = await Order.create({
            userId,
            totalAmount,
            status: "pending"
        });

        res.status(200).json({
            orderId: order.id,
            totalAmount
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

exports.initializePayment = async (req, res) => {
    try {

        const { orderId } = req.body;

        const order = await Order.findByPk(orderId);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const reference = `ORDER_${order.id}_${Date.now()}`;

        order.paymentReference = reference;
        await order.save();

        const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
                email: req.user.email,
                amount: order.totalAmount * 100,
                reference
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                }
            }
        );

        return res.json({
            paymentUrl: response.data.data.authorization_url,
            reference: response.data.data.reference
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message
        });
    }
};


exports.verifyPayment = async (req, res) => {

    try {

        const { reference } = req.params;

        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                }
            }
        );

        const payment = response.data.data;

        if (payment.status !== "success") {
            return res.status(400).json({
                message: "Payment failed"
            });
        }

        const order = await Order.findOne({
            where: {
                paymentReference: payment.reference
            }
        });
        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        order.status = "paid";
        await order.save();

        const cartItems = await Cart.findAll({
            where: {
                userId: order.userId
            }
        });

        for (const item of cartItems) {

            const product = await Product.findByPk(
                item.productId
            );

            if (!product) continue;

            product.quantity -= item.quantity;

            await product.save();

            await OrderItem.create({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                price: product.price
            });
        }

        await Cart.destroy({
            where: {
                userId: order.userId
            }
        });

        res.json({
            success: true,
            message: "Payment successful"
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};


exports.getOrders = async (req, res) => {

    try {

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied'
            });
        }

        const orders = await Order.findAll();

        res.json(orders);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};



exports.getOrder = async (req, res) => {

    try {

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied'
            });
        }

        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: 'Order not found'
            });
        }

        res.json(order);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};



exports.updateOrderStatus = async (req, res) => {

    try {

        // 1. check admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied'
            });
        }

        const { status } = req.body;

        // 2. validate status
        const allowedStatus = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                message: 'Invalid status value'
            });
        }

        // 3. find order
        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: 'Order not found'
            });
        }

        // 4. update status
        order.status = status;
        await order.save();

        res.json({
            message: 'Order status updated successfully',
            order
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

