const router = require('express').Router();
const Order = require('../models/Order')
const auth = require('../middleware/auth');

const {
    checkout,
    initializePayment,
    verifyPayment,
    getOrders,
    getOrder,
    updateOrderStatus
} = require('../controllers/orderController');
router.post('/checkout', auth, checkout);

router.post(
    "/payment/initialize",
    auth,
    initializePayment
);

router.get(
    "/payment/verify/:reference",
    verifyPayment
);

router.get('/admin/orders', auth, getOrders);

router.get('/admin/orders/:id', auth, getOrder);

router.put(
    '/admin/orders/:id/status',
    auth,
    updateOrderStatus
);

module.exports = router;