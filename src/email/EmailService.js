const nodemailer = require('nodemailer');
const nodemailerStub = require('nodemailer-stub');

const transporter = nodemailer.createTransport(nodemailerStub.stubTransport);

const sendAccountActivation = async (email, token) => {
  await transporter.sendMail({
    from: 'My app <info@my-app.com',
    to: email,
    subject: 'Account activation',
    html: `Your token is ${token}`,
  });
};

module.exports = { sendAccountActivation };
