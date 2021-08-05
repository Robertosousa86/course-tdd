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

router.post('/api/1.0/users', validateUsername, async (req, res) => {
  await UserService.save(req.body);
  return res.send({ message: 'User created.' });
});

module.exports = router;
