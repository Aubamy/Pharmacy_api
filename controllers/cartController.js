const Cart = require('../models/Cart');
const Product = require('../models/Product');


exports.addToCart = async (req, res) => {

    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        // check product exists
        const product = await Product.findByPk(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // check if already in cart
        let cartItem = await Cart.findOne({
            where: { userId, productId }
        });

        if (cartItem) {
            // update quantity
            cartItem.quantity += Number(quantity || 1);
            await cartItem.save();
        } else {
            // create new cart item
            cartItem = await Cart.create({
                userId,
                productId,
                quantity: quantity || 1
            });
        }

        res.status(201).json({
            message: 'Added to cart successfully',
            cartItem
        });

    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
    }
};



exports.removeFromCart = async (req, res) => {

    try {
        const userId = req.user.id;
        const productId = req.params.productId;

        const cartItem = await Cart.findOne({
            where: {
                userId,
                productId
            }
        });

        if (!cartItem) {
            return res.status(404).json({
                message: 'Item not found in cart'
            });
        }

        await cartItem.destroy();

        res.json({
            message: 'Item removed from cart successfully'
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: 'Server error'
        });
    }
};



exports.getCart = async (req, res) => {

    try {
        const cartItems = await Cart.findAll({
            where: { userId: req.user.id },
            include: [
                {
                    model: Product,
                    attributes: ['productName', 'price', 'image', 'description'] // Specify fields you want the user to see
                }
            ]
        });

        if (cartItems.length === 0) {
            return res.status(200).json({
                message: 'Your cart is empty. No products added yet.',
                cartItems: []
            });
        }

        res.json(cartItems);

    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
    }
};

