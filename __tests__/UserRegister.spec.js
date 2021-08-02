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

describe('User Registration', () => {
  const postValidUser = () => {
    return request(app).post('/api/1.0/users').send({
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
    });
  };

  it('should be returns 200 OK when singup request is valid', async () => {
    const response = await postValidUser();
    expect(response.status).toBe(200);
  });

  it('should be returns sucess message when singup request is valid', async () => {
    const response = await postValidUser();
    expect(response.body.message).toBe('User created.');
  });

  it('should be saves user to database', async () => {
    await postValidUser();
    // Query user
    const userList = await User.findAll();
    expect(userList.length).toBe(1);
  });

  it('should be saves the username and email to database', async () => {
    await postValidUser();
    // Query user
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.username).toBe('user1');
    expect(savedUser.email).toBe('user1@mail.com');
  });

  it('should be hashes the password', async () => {
    await postValidUser();
    const userList = await User.findAll();
    const savedUser = userList[0];
    expect(savedUser.password).not.toBe('P4ssword');
  });
});
