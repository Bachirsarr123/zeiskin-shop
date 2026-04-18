require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');

const app = express();

// Connect to MongoDB -> PostgreSQL
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/faqs', require('./routes/faqs'));

// SEO — Sitemap
app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://zeiskin.sn/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://zeiskin.sn/shop.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://zeiskin.sn/product.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`);
});

// SEO — Robots.txt
app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://zeiskin.sn/sitemap.xml`);
});

// SPA fallback — serve HTML for all non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
  // Route admin pages
  if (req.path.startsWith('/admin')) {
    const page = req.path.split('/').pop() || 'index';
    const htmlFile = page.endsWith('.html') ? page : page + '.html';
    res.sendFile(path.join(__dirname, '../public/admin', htmlFile.replace(/^\//, '') || 'index.html'), err => {
      if (err) res.sendFile(path.join(__dirname, '../public/admin/index.html'));
    });
  } else {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur interne du serveur', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\x1b[32m✓ ZEISKIN Server démarré sur http://localhost:${PORT}\x1b[0m`);
});
