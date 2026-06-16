const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

exports.checkout = async (req, res) => {

    try {
        const userId = req.user.id;

        // 1. get cart items
        const cartItems = await Cart.findAll({ where: { userId } });

        if (cartItems.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        let totalAmount = 0;

        // 2. calculate total
        for (let item of cartItems) {
            const product = await Product.findByPk(item.productId);

            if (!product) continue;

            totalAmount += product.price * item.quantity;
        }

        // 3. create order
        const order = await Order.create({
            userId,
            totalAmount,
            status: 'pending'
        });

        // 4. create order items
        for (let item of cartItems) {
            const product = await Product.findByPk(item.productId);

            if (!product) continue;

            await OrderItem.create({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                price: product.price
            });

            // optional: reduce stock
            product.quantity -= item.quantity;
            await product.save();
        }

        // 5. clear cart
        await Cart.destroy({ where: { userId } });

        res.json({
            message: 'Order placed successfully',
            orderId: order.id,
            totalAmount
        });

    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
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

