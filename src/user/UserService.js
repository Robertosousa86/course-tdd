const bcrypt = require('bcrypt');
const User = require('./User');
// crypto is a native library of nodejs for cryptography
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const nodemailerStub = require('nodemailer-stub');

const generateToken = (length) => {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
};

const save = async (body) => {
  const { username, email, password } = body;
  const hash = await bcrypt.hash(password, 10);
  const user = { username: username, email: email, password: hash, activationToken: generateToken(16) };
  await User.create(user);
  const transporter = nodemailer.createTransport(nodemailerStub.stubTransport);
  await transporter.sendMail({
    from: 'My app <info@my-app.com',
    to: email,
    subject: 'Account activation',
    html: `Your token is ${user.activationToken}`,
  });
};

const findByEmail = async (email) => {
  return await User.findOne({ where: { email: email } });
};

module.exports = { save, findByEmail };
