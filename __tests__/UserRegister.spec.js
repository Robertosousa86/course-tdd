const app = require('../src/app');
const request = require('supertest');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
const SMTPServer = require('smtp-server').SMTPServer;
/*
 * Run a function before any of the tests in this file run.
 * If the function returns a promise or is a generator,
 * Jest waits for that promise to solve before running tests.
 */

let lastMail, server;
let simulateSmtpFailure = false;

beforeAll(async () => {
  server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
      let mailBody;
      stream.on('data', (data) => {
        mailBody += data.toString();
      });
      stream.on('end', () => {
        if (simulateSmtpFailure) {
          const err = new Error('Invalid mailbox');
          err.responseCode = 553;
          return callback(err);
        }
        lastMail = mailBody;
        callback();
      });
    },
  });

  await server.listen(8587, 'localhost');

  await sequelize.sync();
});

beforeEach(() => {
  simulateSmtpFailure = false;
  return User.destroy({ truncate: true });
});

afterAll(async () => {
  await server.close();
});

const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'P4ssword',
};

const postUser = (user = validUser, options = {}) => {
  const agent = request(app).post('/api/1.0/users');
  if (options.language) agent.set('Accept-Language', options.language);

  return agent.send(user);
};

describe('User Registration', () => {
  it('should be returns 200 OK when singup request is valid', async () => {
    const response = await postUser();
    expect(response.status).toBe(200);
  });

  it('should be returns sucess message when singup request is valid', async () => {
    const response = await postUser();
    expect(response.body.message).toBe('User created.');
  });

  it('should be saves user to database', async () => {
    await postUser();
    // Query user
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it('should be saves the username and email to database', async () => {
    await postUser();
    // Query user
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@mail.com');
  });

  it('should be hashes the password', async () => {
    await postUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.password).not.toBe('P4ssword');
  });

  it('should be return 400 when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
    });
    expect(response.status).toBe(400);
  });

  it('should be returns validationErrors field in response body when validation error occurs', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@mail.com',
      password: 'P4ssword',
    });
    const body = response.body;
    expect(body.validationErrors).not.toBeUndefined();
  });

  it('should be returns errors for both when username and email is null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'P4ssword',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  it('should be creates user in inactive mode', async () => {
    const newUser = { ...validUser, inactive: false };
    await postUser(newUser);
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('should be creates user in inactive mode even the request body contains inactive as false', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.inactive).toBe(true);
  });

  it('should be creates an activationToken for user', async () => {
    const newUser = { ...validUser, inactive: false };
    await postUser(newUser);
    const users = await User.findAll();
    const savedUser = users[0];
    expect(savedUser.activationToken).toBeTruthy();
  });

  it('should sends Account activation email with activationToken', async () => {
    await postUser();
    const users = await User.findAll();
    const savedUser = users[0];
    expect(lastMail).toContain('user1@mail.com');
    expect(lastMail).toContain(savedUser.activationToken);
  });

  it('should be returns 502 Bad Gateway when sending email fails', async () => {
    simulateSmtpFailure = true;
    const response = await postUser();
    expect(response.status).toBe(502);
  });

  it('should be returns Email failure message when sending email fails', async () => {
    simulateSmtpFailure = true;
    const response = await postUser();
    expect(response.body.message).toBe('E-mail Failure');
  });

  it('should be does not save user to database if activation email fails', async () => {
    simulateSmtpFailure = true;
    await postUser();
    const users = await User.findAll();
    expect(users.length).toBe(0);
  });

  const username_null = 'Username cannot be null';
  const username_size = 'Must have min 4 and max 32 characters';
  const email_null = 'E-mail cannot be null';
  const email_invalid = 'E-mail is not valid';
  const email_inuse = 'E-mail in use';
  const password_null = 'Password cannot be null';
  const password_size = 'Password must be at least 6 characters';
  const password_pattern = 'Password must have at least 1 uppercase, 1 lowercase letter and 1 number';

  it.each`
    field         | value                     | expectedMessage
    ${'username'} | ${null}                   | ${username_null}
    ${'username'} | ${'usr'}                  | ${username_size}
    ${'username'} | ${'a'.repeat(33)}         | ${username_size}
    ${'email'}    | ${null}                   | ${email_null}
    ${'email'}    | ${'mail.com'}             | ${email_invalid}
    ${'email'}    | ${'user.mail.com'}        | ${email_invalid}
    ${'email'}    | ${'user@mail'}            | ${email_invalid}
    ${'password'} | ${null}                   | ${password_null}
    ${'password'} | ${'P4ss'}                 | ${password_size}
    ${'password'} | ${'alllowercase'}         | ${password_pattern}
    ${'password'} | ${'ALLUPPERCASE'}         | ${password_pattern}
    ${'password'} | ${'123456'}               | ${password_pattern}
    ${'password'} | ${'alllowercaseANDUPPER'} | ${password_pattern}
  `('should be returns $expectedMessage when $field is $value', async ({ field, value, expectedMessage }) => {
    const user = {
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
    };
    user[field] = value;
    const response = await postUser(user);
    const body = response.body;
    expect(body.validationErrors[field]).toBe(expectedMessage);
  });

  it(`should returns ${email_inuse} when same email is already use`, async () => {
    await User.create({ ...validUser });
    const response = await postUser();
    expect(response.body.validationErrors.email).toBe(email_inuse);
  });

  it('should be returns errors for both username is null and email is in user', async () => {
    await User.create({ ...validUser });
    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'P4ssword',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });
});

describe('Internationalization', () => {
  const username_null = 'Nome do usuário não pode nulo';
  const username_size = 'Deve conter no mínimo 4 e no máximo 32 caracteres';
  const user_create_success = 'Usuário criado com sucesso';
  const email_null = 'E-mail não pode ser nulo';
  const email_invalid = 'E-mail não é valido';
  const email_inuse = 'E-mail em uso';
  const password_null = 'Senha não pode ser nula';
  const password_size = 'Senha deve ter no mínimo 6 caracteres';
  const password_pattern = 'A senha deve conter ao menos 1 letra maiúscula, 1 letra minúscula e 1 número';
  const email_failure = 'Falha ao enviar E-mail';

  it.each`
    field         | value                     | expectedMessage
    ${'username'} | ${null}                   | ${username_null}
    ${'username'} | ${'usr'}                  | ${username_size}
    ${'username'} | ${'a'.repeat(33)}         | ${username_size}
    ${'email'}    | ${null}                   | ${email_null}
    ${'email'}    | ${'mail.com'}             | ${email_invalid}
    ${'email'}    | ${'user.mail.com'}        | ${email_invalid}
    ${'email'}    | ${'user@mail'}            | ${email_invalid}
    ${'password'} | ${null}                   | ${password_null}
    ${'password'} | ${'P4ss'}                 | ${password_size}
    ${'password'} | ${'alllowercase'}         | ${password_pattern}
    ${'password'} | ${'ALLUPPERCASE'}         | ${password_pattern}
    ${'password'} | ${'123456'}               | ${password_pattern}
    ${'password'} | ${'alllowercaseANDUPPER'} | ${password_pattern}
  `(
    'should be returns $expectedMessage when $field and language is set to Brazilian Portuguese is $value',
    async ({ field, value, expectedMessage }) => {
      const user = {
        username: 'user1',
        email: 'user1@mail.com',
        password: 'P4ssword',
      };
      user[field] = value;
      const response = await postUser(user, { language: 'pt-BR' });
      const body = response.body;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    }
  );

  it(`should returns ${email_inuse} when same email is already use when language is Brazilian Portuguese`, async () => {
    await User.create({ ...validUser });
    const response = await postUser({ ...validUser }, { language: 'pt-BR' });
    expect(response.body.validationErrors.email).toBe(email_inuse);
  });

  it(`should be returns ${user_create_success} when singup request is valid and language is Brazilian Portuguese`, async () => {
    const response = await postUser({ ...validUser }, { language: 'pt-BR' });
    expect(response.body.message).toBe(user_create_success);
  });

  it(`should be returns ${email_failure} message when sending email fails and language set is Brazilian Portuguese`, async () => {
    simulateSmtpFailure = true;
    const response = await postUser({ ...validUser }, { language: 'pt-BR' });
    expect(response.body.message).toBe(email_failure);
  });
});

describe('Account activation', () => {
  it('should be activates the account when corret token is send', async () => {
    await postUser();
    let users = await User.findAll();
    const token = await users[0].activationToken;

    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    users = await User.findAll();
    expect(users[0].inactive).toBe(false);
  });

  it('should be removes the token from user table after succssefull activation', async () => {
    await postUser();
    let users = await User.findAll();
    const token = await users[0].activationToken;

    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    users = await User.findAll();
    expect(users[0].activationToken).toBeFalsy();
  });

  it('should be does not activate the account when token is wrong', async () => {
    await postUser();
    const token = 'This-token-does-not-exist';

    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    const users = await User.findAll();
    expect(users[0].inactive).toBe(true);
  });

  it('should be return bad request when token is wrong', async () => {
    await postUser();
    const token = 'This-token-does-not-exist';

    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    expect(response.status).toBe(400);
  });

  it.each`
    language   | tokenStatus  | message
    ${'pt-BR'} | ${'wrong'}   | ${'Esta conta já está ativa ou o token é inválido'}
    ${'en'}    | ${'wrong'}   | ${'This account either active or the token is invalid'}
    ${'pt-BR'} | ${'correct'} | ${'Conta esta ativada'}
    ${'en'}    | ${'correct'} | ${'Account is activated'}
  `(
    'should be returns $message when token is $tokenStatus and language is $language',
    async ({ language, tokenStatus, message }) => {
      await postUser();
      let token = 'This-token-does-not-exist';
      if (tokenStatus === 'correct') {
        let users = await User.findAll();
        token = users[0].activationToken;
      }

      const response = await request(app)
        .post('/api/1.0/users/token/' + token)
        .set('Accept-Language', language)
        .send();
      expect(response.body.message).toBe(message);
    }
  );
});
