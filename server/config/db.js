const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false
    })
  : new Sequelize(
      process.env.DB_NAME || 'zeiskin',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    );

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('\x1b[32m✓ PostgreSQL connecté avec succès\x1b[0m');
    // Synchronisation des schémas (n'efface pas les données)
    await sequelize.sync({ alter: true });
    console.log('\x1b[32m✓ Tables PostgreSQL synchronisées\x1b[0m');
  } catch (error) {
    console.error('\x1b[31m✗ Erreur PostgreSQL:', error.message, '\x1b[0m');
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
