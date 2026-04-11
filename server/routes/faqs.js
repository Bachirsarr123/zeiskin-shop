const express = require('express');
const router = express.Router();
const Faq = require('../models/Faq');
const auth = require('../middleware/auth');

// GET all faqs (Public)
router.get('/', async (req, res) => {
  try {
    const faqs = await Faq.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des FAQ', error: error.message });
  }
});

// Admin routes below

// GET all faqs including inactive (Admin)
router.get('/all', auth, async (req, res) => {
  try {
    const faqs = await Faq.findAll({
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// CREATE a faq
router.post('/', auth, async (req, res) => {
  try {
    const { question, answer, order, isActive } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ message: 'La question et la réponse sont requises' });
    }
    const faq = await Faq.create({ question, answer, order, isActive });
    res.status(201).json(faq);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création', error: error.message });
  }
});

// UPDATE a faq
router.put('/:id', auth, async (req, res) => {
  try {
    const faq = await Faq.findByPk(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ non trouvée' });

    await faq.update(req.body);
    res.json(faq);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour', error: error.message });
  }
});

// DELETE a faq
router.delete('/:id', auth, async (req, res) => {
  try {
    const faq = await Faq.findByPk(req.params.id);
    if (!faq) return res.status(404).json({ message: 'FAQ non trouvée' });

    await faq.destroy();
    res.json({ message: 'FAQ supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression', error: error.message });
  }
});

module.exports = router;
