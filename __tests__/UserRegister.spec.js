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
  it('should be returns 200 OK when singup request is valid', (done) => {
    request(app)
      .post('/api/1.0/users')
      .send({
        username: 'user1',
        email: 'user1@mail.com',
        password: 'P4ssword',
      })
      .then((res) => {
        expect(res.status).toBe(200);
        done();
      });
  });

  it('should be returns sucess message when singup request is valid', (done) => {
    request(app)
      .post('/api/1.0/users')
      .send({
        username: 'user1',
        email: 'user1@mail.com',
        password: 'P4ssword',
      })
      .then((res) => {
        expect(res.body.message).toBe('User created.');
        done();
      });
  });

  it('should be saves user to database', (done) => {
    request(app)
      .post('/api/1.0/users')
      .send({
        username: 'user1',
        email: 'user1@mail.com',
        password: 'P4ssword',
      })
      .then(() => {
        // Query user
        User.findAll().then((userList) => {
          expect(userList.length).toBe(1);
          done();
        });
      });
  });

  it('should be saves the username and email to database', (done) => {
    request(app)
      .post('/api/1.0/users')
      .send({
        username: 'user1',
        email: 'user1@gmail.com',
        password: 'P4ssword',
      })
      .then(() => {
        // Query user
        User.findAll().then((userList) => {
          const savedUser = userList[0];
          expect(savedUser.username).toBe('user1');
          expect(savedUser.email).toBe('user1@gmail.com');
          done();
        });
      });
  });
});
