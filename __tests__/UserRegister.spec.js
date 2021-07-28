const app = require('../app');
const request = require('supertest');

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
});
