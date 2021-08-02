const express = require('express');
const UserRouter = require('./user/UserRouter');
const app = express();
// http://expressjs.com/pt-br/api.html#express.json
app.use(express.json());

app.use(UserRouter);

module.exports = app;
