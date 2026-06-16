require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { sequelize } = require('./config/database');
const { connectDB } = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

sequelize.sync({ alter: true })
  .then(() => {
    console.log(' Database synced');
  })
  .catch(err => {
    console.log(' Sync error:', err);
  });

app.get('/', (req, res) => {
  res.send('Welcome to Diamond Pharmacy');
});

app.use('/api/auth/', authRoutes);
app.use('/api', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api/admin', adminRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000...');
});