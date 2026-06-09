const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    productName: {
        type: DataTypes.STRING,
        allowNull: false
    },

    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },

    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },

    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },

    category: {
        type: DataTypes.STRING,
        allowNull: false
    },

    image: {
        type: DataTypes.STRING
    }
});

module.exports = Product;