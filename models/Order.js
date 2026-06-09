const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },

    totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },

    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending' // pending, paid, delivered, cancelled
    }
});

module.exports = Order;