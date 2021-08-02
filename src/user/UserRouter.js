const express = require('express');
const bcrypt = require('bcrypt');
const User = require('./User');

const router = express.Router();

router.post('/api/1.0/users', (req, res) => {
  bcrypt.hash(req.body.password, 10).then((hash) => {
    const user = { ...req.body, password: hash };
    User.create(user).then(() => {
      return res.send({ message: 'User created.' });
    });
  });
});

module.exports = router;
