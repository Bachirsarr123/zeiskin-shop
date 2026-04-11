const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const auth = require('../middleware/auth');

// Get settings (Public)
router.get('/', async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create({});
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
});

// Update settings (Admin)
router.put('/', auth, async (req, res) => {
  try {
    let setting = await Setting.findOne();
    if (!setting) {
      setting = await Setting.create(req.body);
    } else {
      await setting.update(req.body);
    }
    res.json(setting);
  } catch (error) {
    res.status(400).json({ message: 'Erreur mise à jour', error: error.message });
  }
});

module.exports = router;
