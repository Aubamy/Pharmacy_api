const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

exports.getUsers = async (req, res) => {

    try {

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied'
            });
        }

        const users = await User.findAll();

        res.json(users);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};



exports.getProducts = async (req, res) => {

    try {

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied'
            });
        }

        const products = await Product.findAll();

        res.json(products);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};



exports.dashboard = async (req, res) => {

    try {

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // 1. total users
        const totalUsers = await User.count();

        // 2. total orders
        const totalOrders = await Order.count();

        // 3. total products
        const totalProducts = await Product.count();

        // 4. total sales (sum of all orders)
        const totalSales = await Order.sum('totalAmount');

        // 5. total available stock
        const products = await Product.findAll();

        let totalStock = 0;
        products.forEach(p => {
            totalStock += p.quantity;
        });

        res.json({
            totalUsers,
            totalOrders,
            totalProducts,
            totalSales,
            totalStock
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

