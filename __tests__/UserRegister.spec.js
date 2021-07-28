const app = require('../app');
const request = require('supertest');

it('should be returns 200 OK when singup request is valid', () => {
  request(app)
    .post('/api/1.0/users')
    .send({
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
    })
    .expect(200);
});
