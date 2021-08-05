const express = require('express');
const UserService = require('./UserService');

const router = express.Router();

const validateUsername = (req, res, next) => {
  const user = req.body;

  if (user.username === null)
    return res.status(400).send({
      validationErrors: {
        username: 'Username cannot be null',
      },
    });
  next();
};

const validateEmail = (req, res, next) => {
  const user = req.body;

  if (user.email === null)
    return res.status(400).send({
      validationErrors: {
        email: 'E-mail cannot be null',
      },
    });
  next();
};

router.post('/api/1.0/users', validateUsername, validateEmail, async (req, res) => {
  await UserService.save(req.body);
  return res.send({ message: 'User created.' });
});

module.exports = router;
