const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Model = Sequelize.Model;
/*
 * Models are the essence of Sequelize. A model is an abstraction that represents a table in your database.
 * In Sequelize, it is a class that extends Model.
 */
class User extends Model {}

User.init(
  {
    username: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
    },
    password: {
      type: Sequelize.STRING,
    },
    inactive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'user',
  }
);

module.exports = User;
