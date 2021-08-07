const express = require('express');
const UserService = require('./UserService');
const { check, validationResult } = require('express-validator');

const router = express.Router();

router.post(
  '/api/1.0/users',
  check('username')
    .isLength({ min: 4 })
    .withMessage('Must have min 4 and max 32 characters')
    .notEmpty()
    .withMessage('Username cannot be null'),
  check('email').notEmpty().withMessage('E-mail cannot be null'),
  check('password').notEmpty().withMessage('Password cannot be null'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const validationErrors = {};
      errors.array().forEach((error) => {
        validationErrors[error.param] = error.msg;
      });
      return res.status(400).send({ validationErrors: validationErrors });
    }
    await UserService.save(req.body);
    return res.send({ message: 'User created.' });
  }
);

module.exports = router;
