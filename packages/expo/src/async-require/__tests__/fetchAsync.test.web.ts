/* eslint-env jest browser */
import { fetchAsync } from '../fetchAsync';

declare const global: any;

const originalFetch = global.fetch;

beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ body: '', text: jest.fn(() => 'mock'), headers: {} })
  );
});

afterAll(() => {
  global.fetch = originalFetch;
});

it(`fetches`, async () => {
  await expect(fetchAsync('https://example.com')).resolves.toBeDefined();
  expect(global.fetch).toHaveBeenCalledWith('https://example.com', {
    headers: { 'expo-platform': 'web' },
    method: 'GET',
  });
});
