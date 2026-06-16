const router = require('express').Router();
const Order = require('../models/Order')
const auth = require('../middleware/auth');

const {
    checkout,
    getOrders,
    getOrder,
    updateOrderStatus
} = require('../controllers/orderController');

router.post('/checkout', auth, checkout);

router.get('/admin/orders', auth, getOrders);

router.get('/admin/orders/:id', auth, getOrder);

router.put(
    '/admin/orders/:id/status',
    auth,
    updateOrderStatus
);

module.exports = router;