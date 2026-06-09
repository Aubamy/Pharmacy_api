const { Sequelize } = require('sequelize');
require('dotenv').config();
console.log('DB URL from database.js:', process.env.DATABASE_URL);

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',

  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },

  protocol: 'postgres',

  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Neon PostgreSQL Connected...');
  } catch (error) {
    console.error('DB Error:', error.message);
  }
};

module.exports = { sequelize, connectDB };