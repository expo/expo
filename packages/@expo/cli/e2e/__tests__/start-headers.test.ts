/* eslint-env jest */
import { getRouterE2ERoot } from './utils';
import { createExpoStart } from '../utils/expo';

describe('server headers', () => {
  const projectRoot = getRouterE2ERoot();
  const expo = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'development',
      EXPO_USE_STATIC: 'static',
      E2E_ROUTER_SRC: 'server-headers',
      E2E_ROUTER_HEADERS: JSON.stringify({
        'X-Powered-By': 'expo-server',
        'Set-Cookie': ['hello=world', 'foo=bar'],
        'Content-Type': 'application/pdf',
      }),
      E2E_ROUTER_REWRITES: JSON.stringify([
        {
          source: '/rewrite/api',
          destination: '/api',
        },
      ]),
      CI: '0',
    },
  });

  beforeAll(async () => {
    await expo.startAsync();
  });

  afterAll(async () => {
    await expo.stopAsync();
  });

  it.each([
    {
      path: '/',
      status: 200,
      contentType: 'text/html',
    },
    {
      path: '/api',
      status: 200,
      contentType: 'application/json',
    },
    {
      path: '/rewrite/api',
      status: 200,
      contentType: 'application/json',
    },
    {
      path: '/not-a-route',
      status: 404,
      contentType: 'text/html',
    },
  ])('applies custom headers to $path', async ({ path, status, contentType }) => {
    const response = await expo.fetchAsync(path);

    expect(response.status).toBe(status);

    // Check that existing Content-Type header is not overridden
    expect(response.headers.get('Content-Type')).toBe(contentType);

    // Check single-value custom header
    expect(response.headers.get('X-Powered-By')).toBe('expo-server');

    // Check array-value custom headers
    expect(response.headers.get('Set-Cookie')).toBe('hello=world, foo=bar');
  });
});
