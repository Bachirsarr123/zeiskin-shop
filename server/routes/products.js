const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Product = require('../models/Product');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

// Format product properties to match front-end expectations
const formatProduct = (p) => {
  const data = p.toJSON();
  data._id = data.id;
  if (data.category) {
    data.category._id = data.category.id;
  }
  return data;
};

// Get all products (Public)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const where = { isActive: true };

    if (req.query.category) where.categoryId = req.query.category;
    if (req.query.search) {
      where.name = { [Op.iLike]: `%${req.query.search}%` };
    }
    if (req.query.minPrice || req.query.maxPrice) {
      where.price = {};
      if (req.query.minPrice) where.price[Op.gte] = Number(req.query.minPrice);
      if (req.query.maxPrice) where.price[Op.lte] = Number(req.query.maxPrice);
    }

    let order = [['createdAt', 'DESC']];
    if (req.query.sort === 'price_asc') order = [['price', 'ASC']];
    if (req.query.sort === 'price_desc') order = [['price', 'DESC']];
    if (req.query.sort === 'popular') order = [['id', 'DESC']]; // Simplification

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category' }],
      order,
      limit,
      offset
    });

    res.json({
      products: rows.map(formatProduct),
      total: count,
      page,
      pages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
});

// Featured products
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { isActive: true, isFeatured: true },
      include: [{ model: Category, as: 'category' }],
      limit: 4,
      order: [['createdAt', 'DESC']]
    });
    res.json(products.map(formatProduct));
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
});

// Admin Get all (must be before /:slug)
router.get('/all/admin', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.search) {
      where.name = { [Op.iLike]: `%${req.query.search}%` };
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category' }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      products: rows.map(formatProduct),
      total: count,
      page,
      pages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
});



// Get by slug
router.get('/:slug', async (req, res) => {
  if (req.params.slug === 'all') return res.status(404).json({ message: 'Not found' }); // safeguard
  try {
    const product = await Product.findOne({
      where: { slug: req.params.slug, isActive: true },
      include: [{ model: Category, as: 'category' }]
    });

    if (!product) return res.status(404).json({ message: 'Non trouvé' });

    const related = await Product.findAll({
      where: {
        categoryId: product.categoryId,
        id: { [Op.ne]: product.id },
        isActive: true
      },
      include: [{ model: Category, as: 'category' }],
      limit: 4
    });

    res.json({ product: formatProduct(product), related: related.map(formatProduct) });
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
});

// Create
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    data.isActive = data.isActive === 'true';
    data.isFeatured = data.isFeatured === 'true';
    data.isNew = data.isNew === 'true';
    data.price = Number(data.price);
    data.comparePrice = data.comparePrice ? Number(data.comparePrice) : null;
    data.stock = Number(data.stock);

    if (typeof data.tags === 'string') {
      data.tags = data.tags.trim() ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    }
    if (data.variants && typeof data.variants === 'string') {
      try { data.variants = JSON.parse(data.variants); } catch (e) { data.variants = []; }
    }

    if (req.files && req.files.length > 0) {
      data.images = req.files.map(f => ({ url: f.path }));
    }

    const product = await Product.create(data);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: 'Erreur création', error: error.message });
  }
});

// Update
router.put('/:id', auth, upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Non trouvé' });

    const data = { ...req.body };
    const fields = ['name', 'description', 'ingredients', 'categoryId'];
    fields.forEach(f => { if (data[f] !== undefined) product[f] = data[f]; });

    if (data.price !== undefined) product.price = Number(data.price);
    if (data.comparePrice !== undefined) product.comparePrice = data.comparePrice ? Number(data.comparePrice) : null;
    if (data.stock !== undefined) product.stock = Number(data.stock);

    if (data.isActive !== undefined) product.isActive = data.isActive === 'true';
    if (data.isFeatured !== undefined) product.isFeatured = data.isFeatured === 'true';
    if (data.isNew !== undefined) product.isNew = data.isNew === 'true';

    if (typeof data.tags === 'string') {
      product.tags = data.tags.trim() ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    }
    if (data.variants && typeof data.variants === 'string') {
      try { product.variants = JSON.parse(data.variants); } catch(e){}
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => ({ url: f.path }));
      product.images = data.keepImages === 'true' ? [...(product.images||[]), ...newImages] : newImages;
    } else if (data.keepImages !== 'true') {
      product.images = [];
    }

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: 'Erreur modification', error: error.message });
  }
});

// Delete
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Non trouvé' });
    await product.destroy();
    res.json({ message: 'Produit supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
});

module.exports = router;
