const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Category = require('./Category');

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

const Product = sequelize.define('Product', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  slug: { type: DataTypes.STRING, unique: true },
  description: { type: DataTypes.TEXT, allowNull: false },
  ingredients: { type: DataTypes.TEXT },
  price: { type: DataTypes.INTEGER, allowNull: false },
  comparePrice: { type: DataTypes.INTEGER },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  images: { type: DataTypes.JSONB, defaultValue: [] }, 
  variants: { type: DataTypes.JSONB, defaultValue: [] }, 
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
  isNew: { type: DataTypes.BOOLEAN, defaultValue: true },
  tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] }
});

Product.beforeValidate((product) => {
  if (product.name && !product.slug) {
    product.slug = slugify(product.name);
  }
});

Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

module.exports = Product;
