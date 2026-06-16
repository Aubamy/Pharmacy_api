const router = require('express').Router();
const Cart = require('../models/Cart');
const auth = require('../middleware/auth');

const {
    addToCart,
    removeFromCart,
    getCart
} = require('../controllers/cartController');

router.post('/add', auth, addToCart);

router.delete('/:productId', auth, removeFromCart);

router.get('/', auth, getCart);

module.exports = router;