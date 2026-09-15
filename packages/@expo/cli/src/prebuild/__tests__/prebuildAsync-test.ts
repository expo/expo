import { getConfig } from '@expo/config';

import { prebuildAsync } from '../prebuildAsync';

jest.mock('@expo/config', () => ({
  ...jest.requireActual('@expo/config'),
  getConfig: jest.fn(),
}));

const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    NODE_ENV: 'production',
  };
  jest.mocked(getConfig).mockImplementation(() => {
    throw new Error('stop');
  });
});

afterAll(() => {
  process.env = originalEnv;
});

it('keeps NODE_ENV when called internally', async () => {
  await expect(prebuildAsync('/', { platforms: ['android'] })).rejects.toThrow('stop');

  expect(process.env.NODE_ENV).toBe('production');
});
