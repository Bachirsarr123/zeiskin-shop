const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ where: { username } });

    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, username: admin.username });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Verify Token
router.get('/verify', auth, async (req, res) => {
  try {
    // req.admin comes from auth middleware
    const admin = await Admin.findByPk(req.admin.id, { attributes: { exclude: ['password'] } });
    if (!admin) return res.status(404).json({ message: 'Admin non trouvé' });
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Update Password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findByPk(req.admin.id);

    if (!(await admin.matchPassword(currentPassword))) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    admin.password = newPassword; // Will be hashed via beforeSave hook
    await admin.save();
    res.json({ message: 'Mot de passe mis à jour' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
