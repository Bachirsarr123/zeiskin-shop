const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Setting = sequelize.define('Setting', {
  whatsappNumber: { type: DataTypes.STRING, defaultValue: '+221703046152' },
  shopName: { type: DataTypes.STRING, defaultValue: 'ZEISKIN' },
  shopEmail: { type: DataTypes.STRING, defaultValue: 'Traorezainab51@gmail.com' },
  shopAddress: { type: DataTypes.STRING, defaultValue: 'Sénégal' },
  currency: { type: DataTypes.STRING, defaultValue: 'FCFA' },
  heroTitle: { type: DataTypes.STRING, defaultValue: 'La beauté naturelle, sublimée.' },
  heroSubtitle: { type: DataTypes.TEXT, defaultValue: 'Soins des lèvres & corps formulés avec des ingrédients naturels soigneusement sélectionnés, pour une peau rayonnante au quotidien.' },
  whatsappMessageTemplate: { type: DataTypes.TEXT, defaultValue: 'Bonjour ZEISKIN 🌿\n\nJe souhaite valider ma commande :\n\n{ITEMS}\n\nTotal : {TOTAL}' },
  instagramUrl: { type: DataTypes.STRING },
  facebookUrl: { type: DataTypes.STRING },
  tiktokUrl: { type: DataTypes.STRING }
});

module.exports = Setting;
