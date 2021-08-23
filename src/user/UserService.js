const bcrypt = require('bcrypt');
const User = require('./User');
// crypto is a native library of nodejs for cryptography
const crypto = require('crypto');

const generateToken = (length) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

const save = async (body) => {
  const { username, email, password } = body;
  const hash = await bcrypt.hash(password, 10);
  const user = { username: username, email: email, password: hash, activationToken: generateToken(16) };
  await User.create(user);
};

const findByEmail = async (email) => {
  return await User.findOne({ where: { email: email } });
};

module.exports = { save, findByEmail };
