const express = require('express');
require('dotenv').config();
const mysql = require('mysql2');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const path = require('path');
const { Sequelize } = require('sequelize');
// const sequelize = require('./config/database');
const { sequelize } = require('./config/database');
const { connectDB } = require('./config/database');
// const upload = require('./config/multer');
const uploadToCloudinary = require('./utils/uploadToCloudinary');
const auth = require('./middleware/auth');
const upload = require('./middleware/uploadMiddleware');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const User = require('./models/User');
const Cart = require('./models/Cart');
const Product = require('./models/Product');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// sequelize.authenticate()
//   .then(() => {
//     console.log('✅ XAMPP MySQL connected successfully');
//   })
//   .catch((err) => {
//     console.error('❌ Error connecting to XAMPP MySQL:', err);
//   });

connectDB();

console.log('DATABASE_URL:', process.env.DATABASE_URL);


sequelize.sync({ alter: true })
  .then(() => {
    console.log('📦 Database synced');
  })
  .catch(err => {
    console.log('❌ Sync error:', err);
  });

const adminOnly = (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Access denied. Admin only'
      });
    }

    next();
  } catch (err) {
    return res.status(500).send('Server error');
  }
};

app.get('/', (req, res) => {
  res.send("Welcome to Diamon Pharmacy");
});

app.post('/register', async (req, res) => {
  try {
    const schema = Joi.object({
      fullName: Joi.string().min(3).required(),
      email: Joi.string().email().required(),
      phone: Joi.string().min(10).required(),
      password: Joi.string().min(6).required(),
      confirmPassword: Joi.ref('password')
    });

    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).send(error.details[0].message);
    }

    const { fullName, email, phone, password } = req.body;

    // check if user exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).send('User already exists');
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);


    // create user
    const user = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword,
      role: 'user'
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (err) {
    console.log(err); // 👈 IMPORTANT
    res.status(500).send(err.message);
  }
});


app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. check if user exists
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).send('User not found');
    }

    // 2. compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send('Invalid credentials');
    }

    // 3. generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      'secretkey123', // later we move to .env
      { expiresIn: '7d' }
    );

    // 4. send response
    res.json({
      message: 'Login successful',
      token
    });

  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
});

app.post('/api/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logout successful"
  });
});

app.put('/edit-profile', auth, async (req, res) => {
  try {
    const fullName = req.body?.fullName;
    const phone = req.body?.phone;
    const email = req.body?.email;

    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    await user.update({
      fullName: fullName || user.fullName,
      phone: phone || user.phone,
      email: email || user.email
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
});

// app.post('/add-products', auth, adminOnly, upload.single('image'), async (req, res) => {
//   try {

//     const schema = Joi.object({
//       productName: Joi.string().required(),
//       description: Joi.string().required(),
//       price: Joi.number().required(),
//       quantity: Joi.number().required(),
//       category: Joi.string().required()
//     });

//     const { error } = schema.validate(req.body);
//     if (error) return res.status(400).send(error.details[0].message);

//     // let imageUrl = '';

//     // if (req.file) {
//     //   const result = await uploadToCloudinary(req.file.buffer);
//     //   imageUrl = result.secure_url;
//     // }
//     if (!req.file) {
//       return res.status(400).json({
//         message: "Recipe image is required",
//       });
//     }


//     const image = req.file
//       ? req.file.path
//       : null;

//     const product = await Product.create({
//       ...req.body,
//       image,
//     });
//     // const product = await Product.create({

//     // });

//     res.status(201).json({
//       message: 'Product added successfully',
//       product
//     });

//   } catch (err) {
//     console.log(err);
//     res.status(500).send('Server error');
//   }
// });

app.post('/add-products', auth, adminOnly, upload.single('image'), async (req, res) => {
  try {

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
});

app.put('/edit-products/:id', auth, adminOnly, upload.single('image'), async (req, res) => {
  try {
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
});


app.delete('/api/admin/products/:id', auth, async (req, res) => {
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
});


app.post('/cart/add', auth, async (req, res) => {
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
});

console.log("CART TYPE:", typeof Cart);
console.log("CART VALUE:", Cart);

app.delete('/cart/:productId', auth, async (req, res) => {
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
});

app.get('/cart', auth, async (req, res) => {
  try {
    const cartItems = await Cart.findAll({
      where: {
        userId: req.user.id
      }
    });

    res.json(cartItems);

  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
});

app.post('/checkout', auth, async (req, res) => {
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
});


app.get('/api/admin/orders', auth, async (req, res) => {
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
});

app.get('/api/admin/orders/:id', auth, async (req, res) => {
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
});

app.put('/api/admin/orders/:id/status', auth, async (req, res) => {
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
});


app.get('/api/admin/users', auth, async (req, res) => {
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
});

app.get('/api/admin/products', auth, async (req, res) => {
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
});

app.get('/api/admin/dashboard', auth, async (req, res) => {
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
});

app.listen(3000, () => {
  console.log("server running on port 3000...");
});