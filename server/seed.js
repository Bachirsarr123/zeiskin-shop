const bcrypt = require('bcryptjs');
require('dotenv').config();
const { sequelize, connectDB } = require('./config/db');
const Admin = require('./models/Admin');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Setting = require('./models/Setting');
const WhatsappClick = require('./models/WhatsappClick');

const runSeed = async () => {
  try {
    // 1. Connexion et synchronisation avec écrasement forcé des données
    console.log('🔄 Connexion à PostgreSQL...');
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('🔄 BDD réinitialisée (force: true)');

    // 2. Admin
    console.log('👤 Création compte admin...');
    // Le hook 'beforeSave' va hasher le mot de passe automatiquement
    await Admin.create({ username: 'admin', password: 'Zeiskin@2024' });

    // 3. Catégories
    console.log('📁 Création des catégories...');
    const catLevres = await Category.create({ name: 'Soins Lèvres', description: 'Baumes et gommages pour des lèvres douces et repulpées.' });
    const catCorps = await Category.create({ name: 'Soins Corps', description: 'Huiles, crèmes et gommages pour sublimer votre peau.' });
    const catCoffrets = await Category.create({ name: 'Coffrets & Kits', description: 'Découvrez nos rituels complets.' });

    // 4. Produits
    console.log('🛍️ Création des produits...');
    const productsData = [
      {
        name: 'Baume Lèvres Karité & Hibiscus',
        description: 'Un baume riche et teinté naturellement pour nourrir et réparer vos lèvres tout au long de la journée. Fini lumineux et non collant.',
        ingredients: 'Beurre de karité pur, Huile d\'amande douce, Poudre d\'hibiscus, Cire d\'abeille, Vitamine E.',
        price: 3500,
        stock: 50,
        categoryId: catLevres.id,
        isFeatured: true,
        tags: ['best-seller', 'hydratant', 'levres']
      },
      {
        name: 'Gommage Corps Exfoliant Café Miel',
        description: 'Un gommage revigorant qui élimine les peaux mortes tout en hydratant profondément grâce à l\'action combinée du café et du miel.',
        ingredients: 'Marc de café infusé, Miel pur du Sénégal, Sucre roux, Huile de coco.',
        price: 8000,
        stock: 30,
        categoryId: catCorps.id,
        isFeatured: true,
        tags: ['exfoliant', 'douceur']
      },
      {
        name: 'Huile Scintillante Glow Argan',
        description: 'Une huile sèche pour le corps qui sublime le bronzage et laisse un discret voile perlé sur la peau.',
        ingredients: 'Huile d\'argan, Huile de macadamia, Micas naturels, Parfum naturel de Tiaré.',
        price: 12000,
        comparePrice: 15000,
        stock: 20,
        categoryId: catCorps.id,
        variants: [{ type: 'Taille', options: [{ value: '100ml', stock: 15 }, { value: '250ml', stock: 5 }] }],
        tags: ['glow', 'huile']
      },
      {
        name: 'Coffret Rituel Éclat',
        description: 'Le trio parfait pour un moment cocooning complet : 1 Baume lèvres, 1 Mini gommage corps et 1 Huile scintillante 50ml.',
        price: 20000,
        comparePrice: 25000,
        stock: 12,
        categoryId: catCoffrets.id,
        isFeatured: true,
        isNew: true
      }
    ];

    for (let p of productsData) {
      // Slug généré via le hook
      await Product.create(p);
    }

    // 5. Settings
    console.log('⚙️ Création des paramètres de la boutique...');
    await Setting.create({
      whatsappNumber: '+221703046152',
      shopName: 'ZEISKIN',
      shopEmail: 'Traorezainab51@gmail.com',
      currency: 'FCFA',
      heroTitle: 'La beauté naturelle, sublimée.',
      heroSubtitle: 'Soins des lèvres & corps formulés avec des ingrédients naturels soigneusement sélectionnés, pour une peau rayonnante au quotidien.'
    });

    console.log('\x1b[32m✅ BDD PostgreSQL initialisée avec succès ! Les fausses données ont été injectées.\x1b[0m');
    process.exit(0);

  } catch (error) {
    console.error('\x1b[31m❌ Erreur lors du seed PostgreSQL :\x1b[0m');
    console.error(error);
    process.exit(1);
  }
};

runSeed();
