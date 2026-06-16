const router = require('express').Router();

const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const {
    getUsers,
    getProducts,
    dashboard
} = require('../controllers/adminController');


router.get('/users', auth, admin, getUsers);

router.get('/products', auth, admin, getProducts);

router.get('/dashboard', auth, admin, dashboard);

module.exports = router;