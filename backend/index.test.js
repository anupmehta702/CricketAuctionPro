const request = require('supertest');
const app = require('./index'); 
const { createClient } = require('@supabase/supabase-js');

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [{ id: 1, name: 'Team 1' }], error: null }),
    })),
  })),
}));

describe('GET /teams', () => {
  it('should return a list of teams', async () => {
    const response = await request(app).get('/teams');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ id: 1, name: 'Team 1' }]);
  });
});
