import { createEnvironment } from '../common';

describe(createEnvironment, () => {
  it('applies custom headers via beforeResponse', async () => {
    const responseInit = { headers: new Headers({ 'Content-Type': 'text/html' }) };
    const manifest = {
      htmlRoutes: [],
      apiRoutes: [],
      notFoundRoutes: [],
      redirects: [],
      rewrites: [],
      headers: {
        'X-Powered-By': 'expo-dev',
        'Set-Cookie': ['hello=world', 'foo=bar'],
        'Content-Type': 'application/pdf',
      },
    };
    const env = createEnvironment({
      readText: jest.fn(),
      readJson: jest.fn(() => Promise.resolve(manifest)),
      loadModule: jest.fn(),
    });

    await env.getRoutesManifest();
    const result = env.beforeResponse(responseInit, {});

    // Check that existing content-type header is not overridden
    expect(result.headers.get('Content-Type')).toBe('text/html');

    // Check single-value custom header
    expect(result.headers.get('X-Powered-By')).toBe('expo-dev');

    // Check array-value custom headers
    expect(result.headers.get('Set-Cookie')).toBe('hello=world, foo=bar');
  });
});
