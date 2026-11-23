import { createExpoStart } from '../utils/expo';
/* eslint-env jest */
import { getServerTesterRoot } from './utils';

describe('server headers', () => {
  const projectRoot = getServerTesterRoot();
  const expo = createExpoStart({
    cwd: projectRoot,
    env: {
      NODE_ENV: 'development',
      E2E_ROUTER_WEB_OUTPUT: 'server',
      E2E_ROUTER_HEADERS: JSON.stringify({
        'X-Powered-By': 'expo-server',
        'Set-Cookie': ['hello=world', 'foo=bar'],
        'Content-Type': 'application/pdf',
      }),
      E2E_ROUTER_REWRITES: JSON.stringify([
        {
          source: '/headers/rewrite',
          destination: '/headers/api',
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
      path: '/headers',
      status: 200,
      contentType: 'text/html',
    },
    {
      path: '/headers/api',
      status: 200,
      contentType: 'application/json',
    },
    {
      path: '/headers/rewrite',
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
