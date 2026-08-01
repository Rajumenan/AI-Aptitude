import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createRequire } from 'module';

// Import the CommonJS Express app via createRequire
const require = createRequire(import.meta.url);
const app = require('./server.js');

describe('GET /api/health', () => {
  it('should return status 200 OK', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
  });

  it('should return success: true in body', async () => {
    const response = await request(app).get('/api/health');
    expect(response.body.success).toBe(true);
  });

  it('should return a message and timestamp', async () => {
    const response = await request(app).get('/api/health');
    expect(response.body.message).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
  });
});
