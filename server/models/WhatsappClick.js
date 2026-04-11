const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const WhatsappClick = sequelize.define('WhatsappClick', {
  cartItems: { type: DataTypes.JSONB, defaultValue: [] },
  total: { type: DataTypes.INTEGER, defaultValue: 0 },
  currency: { type: DataTypes.STRING, defaultValue: 'FCFA' },
  clickedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = WhatsappClick;
