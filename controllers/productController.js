const Product = require('../models/Product');
const uploadToCloudinary = require('../utils/uploadToCloudinary');
const Joi = require('joi');

exports.getAllProducts = async (req, res) => {
    try {
        // Fetch all products from the database
        const products = await Product.findAll({
            attributes: ['id', 'productName', 'description', 'price', 'quantity', 'category', 'image'],
            order: [['createdAt', 'DESC']] // Shows newest products first
        });

        // If no products exist in the database yet
        if (products.length === 0) {
            return res.status(200).json({
                message: 'No products available in the shop yet.',
                products: []
            });
        }

        // Return the array of products
        res.status(200).json(products);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching products' });
    }
};

exports.addProduct = async (req, res) => {

    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied'
            });
        }

        const schema = Joi.object({
            productName: Joi.string().required(),
            description: Joi.string().required(),
            price: Joi.number().required(),
            quantity: Joi.number().required(),
            category: Joi.string().required()
        });

        const { error } = schema.validate(req.body);

        if (error) {
            return res.status(400).send(error.details[0].message);
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Product image is required"
            });
        }

        const result = await uploadToCloudinary(req.file.buffer);

        const product = await Product.create({
            productName: req.body.productName,
            description: req.body.description,
            price: req.body.price,
            quantity: req.body.quantity,
            category: req.body.category,
            image: result.secure_url
        });

        res.status(201).json({
            message: "Product added successfully",
            product
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
};



exports.editProduct = async (req, res) => {

    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied'
            });
        }

        const id = req.params.id;

        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        await product.update(req.body);

        return res.json({
            message: 'Product updated successfully',
            product
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};



exports.deleteProduct = async (req, res) => {

    try {

        // 1. check admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: 'Access denied'
            });
        }

        // 2. find product
        const product = await Product.findByPk(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        // 3. delete product
        await product.destroy();

        res.json({
            message: 'Product deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

