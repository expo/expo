/* eslint-env jest browser */
import { fetchAsync } from '../fetchAsync';

declare const global: any;

const originalFetch = global.fetch;

beforeAll(() => {
  // eslint-disable-next-line
  global.fetch = jest.fn(() =>
    // eslint-disable-next-line
    Promise.resolve({ body: "", text: jest.fn(() => "mock"), headers: {} })
  );
});

afterAll(() => {
  global.fetch = originalFetch;
});

it(`fetches`, async () => {
  await expect(fetchAsync('https://example.com')).resolves.toBeDefined();
  expect(global.fetch).toBeCalledWith('https://example.com', {
    headers: { 'expo-platform': 'web' },
    method: 'GET',
  });
});
