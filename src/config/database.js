const Sequelize = require('sequelize');

// Creating a new instance of sequelize.
const sequelize = new Sequelize('hoaxify', 'my-db-user', 'db-pass', {
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
});

module.exports = sequelize;
