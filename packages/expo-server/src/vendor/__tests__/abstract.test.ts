import type { Manifest } from '../../manifest';
import { createRequestHandler } from '../abstract';

describe(createRequestHandler, () => {
  it('applies custom headers from manifest', async () => {
    const manifest: Manifest = {
      htmlRoutes: [
        {
          file: 'index',
          page: '/',
          namedRegex: /^\/$/,
          routeKeys: {},
        },
      ],
      apiRoutes: [],
      notFoundRoutes: [],
      redirects: [],
      rewrites: [],
      headers: {
        'X-Powered-By': 'expo-server',
        'Set-Cookie': ['hello=world', 'foo=bar'],
        'Content-Type': 'application/pdf',
      },
    };

    const handler = createRequestHandler({
      getRoutesManifest: jest.fn(async () => manifest),
      getHtml: jest.fn(async () => '<html></html>'),
      getApiRoute: jest.fn(),
      getMiddleware: jest.fn(),
    });

    const request = new Request('http://localhost/');
    const response = await handler(request);

    // Check that existing Content-Type header is not overridden (HTML routes set text/html)
    expect(response.headers.get('Content-Type')).toBe('text/html');

    // Check single-value custom header
    expect(response.headers.get('X-Powered-By')).toBe('expo-server');

    // Check array-value custom headers
    expect(response.headers.get('Set-Cookie')).toBe('hello=world, foo=bar');
  });
});
