const request = require('supertest');
const app = require('../src/app');

const {
  validIssue,
  invalidIssue
} = require('./fixtures/issues');

describe('Issues API', () => {

  test('GET /api/issues returns 200', async () => {

    const response = await request(app)
      .get('/api/issues');

    expect(response.statusCode).toBe(200);

  });

  test('POST /api/issues creates issue', async () => {

    const response = await request(app)
      .post('/api/issues')
      .send(validIssue);

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);

  });

  test('POST /api/issues validation failure', async () => {

    const response = await request(app)
      .post('/api/issues')
      .send(invalidIssue);

    expect(response.statusCode).toBe(400);

  });

});