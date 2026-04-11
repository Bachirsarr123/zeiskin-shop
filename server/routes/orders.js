const express = require('express');
const router = express.Router();
const WhatsappClick = require('../models/WhatsappClick');
const Product = require('../models/Product');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');

// Track WhatsApp click (Public)
router.post('/track', async (req, res) => {
  try {
    const { cartItems, total, currency } = req.body;
    
    // Convert logic: decrease stock of products if ordered
    if (cartItems && cartItems.length) {
      for (let item of cartItems) {
        const product = await Product.findByPk(item.productId || item._id);
        if (product && product.stock > 0) {
          product.stock = Math.max(0, product.stock - item.quantity);
          await product.save();
        }
      }
    }

    const click = await WhatsappClick.create({ cartItems, total, currency });
    res.status(201).json(click);
  } catch (error) {
    res.status(400).json({ message: 'Erreur tracking', error: error.message });
  }
});

// Admin Stats
router.get('/stats', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.period) || 30;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const clicks = await WhatsappClick.findAll({
      where: { clickedAt: { [Op.gte]: dateLimit } },
      order: [['clickedAt', 'DESC']]
    });

    const totalClicks = await WhatsappClick.count();
    const periodClicks = clicks.length;
    
    // Manual reduce
    const totalRevenue = clicks.reduce((sum, cl) => sum + (cl.total || 0), 0);

    // Group by day for chart
    const chartDataObj = {};
    clicks.forEach(cl => {
      const dateStr = cl.clickedAt.toISOString().slice(0, 10);
      if (!chartDataObj[dateStr]) chartDataObj[dateStr] = { date: dateStr, count: 0, revenue: 0 };
      chartDataObj[dateStr].count += 1;
      chartDataObj[dateStr].revenue += cl.total || 0;
    });

    const chartData = Object.values(chartDataObj).sort((a,b) => a.date.localeCompare(b.date));

    // Fix _id compatibility
    const formattedRecent = clicks.slice(0, 10).map(cl => {
      const data = cl.toJSON();
      data._id = data.id;
      return data;
    });

    res.json({
      totalClicks,
      periodClicks,
      totalRevenue,
      chartData,
      recentOrders: formattedRecent
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Admin All Orders
router.get('/all', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await WhatsappClick.findAndCountAll({
      order: [['clickedAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      orders: rows.map(cl => {
        const data = cl.toJSON();
        data._id = data.id;
        return data;
      }),
      total: count,
      page,
      pages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
});

module.exports = router;
