const router = require('express').Router();

const auth = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');



const {
    getAllProducts,
    addProduct,
    editProduct,
    deleteProduct
} = require('../controllers/productController');
router.get('/products', getAllProducts);

router.post(
    '/add-products',
    auth,
    upload.single('image'),
    addProduct
);

router.put(
    '/edit-products/:id',
    auth,
    upload.single('image'),
    editProduct
);

router.delete(
    '/admin/products/:id',
    auth,
    deleteProduct
);

module.exports = router;