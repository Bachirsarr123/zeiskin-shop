const { sequelize } = require('./server/config/db');
const Category = require('./server/models/Category');

async function checkCategories() {
  try {
    const cats = await Category.findAll();
    console.log('Categories found:', JSON.stringify(cats, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkCategories();
