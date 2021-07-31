const express = require('express');
const User = require('./user/User');
const app = express();
const bcrypt = require('bcrypt');

// http://expressjs.com/pt-br/api.html#express.json
app.use(express.json());

app.post('/api/1.0/users', (req, res) => {
  bcrypt.hash(req.body.password, 10).then((hash) => {
    const user = Object.assign({}, req.body, { password: hash });
    User.create(user).then(() => {
      return res.send({ message: 'User created.' });
    });
  });
});

module.exports = app;
