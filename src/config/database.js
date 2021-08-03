const Sequelize = require('sequelize');
const config = require('config');

const dbConfig = config.get('database');

// Creating a new instance of sequelize.
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  dialect: dbConfig.dialect,
  storage: dbConfig.storage,
  logging: dbConfig.logging,
});

module.exports = sequelize;
