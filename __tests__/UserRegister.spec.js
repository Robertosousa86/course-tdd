const app = require('../src/app');
const request = require('supertest');
const User = require('../src/user/User');
const sequelize = require('../src/config/database');
/*
 * Run a function before any of the tests in this file run.
 * If the function returns a promise or is a generator,
 * Jest waits for that promise to solve before running tests.
 */
beforeAll(() => {
  return sequelize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true });
});

const validUser = {
  username: 'user1',
  email: 'user1@mail.com',
  password: 'P4ssword',
};

const postUser = (user = validUser) => {
  return request(app).post('/api/1.0/users').send(user);
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

  it.each`
    field         | value                     | expectedMessage
    ${'username'} | ${null}                   | ${'Username cannot be null'}
    ${'username'} | ${'usr'}                  | ${'Must have min 4 and max 32 characters'}
    ${'username'} | ${'a'.repeat(33)}         | ${'Must have min 4 and max 32 characters'}
    ${'email'}    | ${null}                   | ${'E-mail cannot be null'}
    ${'email'}    | ${'mail.com'}             | ${'E-mail is not valid'}
    ${'email'}    | ${'user.mail.com'}        | ${'E-mail is not valid'}
    ${'email'}    | ${'user@mail'}            | ${'E-mail is not valid'}
    ${'password'} | ${null}                   | ${'Password cannot be null'}
    ${'password'} | ${'P4ss'}                 | ${'Password must be at least 6 characters'}
    ${'password'} | ${'alllowercase'}         | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'ALLUPPERCASE'}         | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'123456'}               | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'alllowercaseaNDUPPER'} | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lowerand123456'}       | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'UPPERAND123456'}       | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
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

  it('should returns E-mail in use when same email is already use', async () => {
    await User.create({ ...validUser });
    const response = await postUser();
    expect(response.body.validationErrors.email).toBe('E-mail in use');
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
