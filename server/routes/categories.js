const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Category = require('../models/Category');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Upload setup
const { categoryStorage } = require('../config/cloudinary');
const upload = multer({ storage: categoryStorage });

// Get all categories (Public)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['createdAt', 'DESC']]
    });

    // Count products for each category
    const categoriesWithCount = await Promise.all(categories.map(async (cat) => {
      const productCount = await Product.count({ where: { categoryId: cat.id } });
      const data = cat.toJSON();
      data._id = data.id; // compatibilité frontend existant
      data.productCount = productCount;
      return data;
    }));

    res.json(categoriesWithCount);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Admin Get All
router.get('/all', auth, async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['createdAt', 'DESC']] });
    
    const categoriesWithCount = await Promise.all(categories.map(async (cat) => {
      const productCount = await Product.count({ where: { categoryId: cat.id } });
      const data = cat.toJSON();
      data._id = data.id;
      data.productCount = productCount;
      return data;
    }));

    res.json(categoriesWithCount);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Create
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const categoryData = { name, description };
    
    if (req.file) {
      categoryData.image = { url: req.file.path };
    }

    const category = await Category.create(categoryData);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: 'Erreur création', error: error.message });
  }
});

// Update
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Non trouvé' });

    const { name, description, keepImage } = req.body;
    category.name = name || category.name;
    category.description = description !== undefined ? description : category.description;

    if (req.file) {
      category.image = { url: req.file.path };
    } else if (keepImage === 'false') {
      category.image = null;
    }

    await category.save();
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: 'Erreur modification', error: error.message });
  }
});

// Delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Non trouvé' });

    // En Sequelize, la suppression supprime aussi l'ID, mais il faut gérer l'intégrité
    await Product.update({ categoryId: null }, { where: { categoryId: category.id } });
    await category.destroy();
    
    res.json({ message: 'Catégorie supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
});

module.exports = router;
