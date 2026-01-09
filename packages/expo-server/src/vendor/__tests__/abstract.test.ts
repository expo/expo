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
      getLoaderData: jest.fn(),
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

  describe('loader requests', () => {
    it('returns loader data as JSON for a route with loader', async () => {
      const manifest: Manifest = {
        htmlRoutes: [
          {
            file: 'index.js',
            page: '/',
            namedRegex: /^\/(?:index)?\/?$/,
            routeKeys: {},
          },
          {
            file: 'second.js',
            page: '/second',
            namedRegex: /^\/second\/?$/,
            routeKeys: {},
            loader: '_expo/loaders/second.js',
          },
        ],
        apiRoutes: [],
        notFoundRoutes: [],
        redirects: [],
        rewrites: [],
      };

      const loaderData = { message: 'Hello from loader', count: 42 };
      const getLoaderData = jest.fn(async () => loaderData);

      const handler = createRequestHandler({
        getRoutesManifest: jest.fn(async () => manifest),
        getHtml: jest.fn(async () => '<html></html>'),
        getApiRoute: jest.fn(),
        getMiddleware: jest.fn(),
        getLoaderData,
      });

      const request = new Request('http://localhost/_expo/loaders/second');
      const response = await handler(request);

      const [loaderRequest] = getLoaderData.mock.calls[0];
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(await response.json()).toEqual(loaderData);
      expect(new URL(loaderRequest.url).pathname).toBe('/second');
    });

    it('passes the correctly modified request to `getLoaderData()`', async () => {
      const manifest: Manifest = {
        htmlRoutes: [
          {
            file: 'about.js',
            page: '/about',
            namedRegex: /^\/about\/?$/,
            routeKeys: {},
            loader: '_expo/loaders/about.js',
          },
        ],
        apiRoutes: [],
        notFoundRoutes: [],
        redirects: [],
        rewrites: [],
      };

      const getLoaderData = jest.fn(async () => ({}));

      const handler = createRequestHandler({
        getRoutesManifest: jest.fn(async () => manifest),
        getHtml: jest.fn(async () => '<html></html>'),
        getApiRoute: jest.fn(),
        getMiddleware: jest.fn(),
        getLoaderData,
      });

      const request = new Request('http://localhost/_expo/loaders/about?foo=bar');
      await handler(request);

      const [loaderRequest] = getLoaderData.mock.calls[0];
      expect(new URL(loaderRequest.url).pathname).toBe('/about');
      expect(new URL(loaderRequest.url).search).toBe('?foo=bar');
    });

    it('handles dynamic route params correctly', async () => {
      const manifest: Manifest = {
        htmlRoutes: [
          {
            file: 'posts/[postId].js',
            page: '/posts/[postId]',
            namedRegex: /^\/posts\/(?<postId>[^/]+?)\/?$/,
            routeKeys: { postId: 'postId' },
            loader: '_expo/loaders/posts/[postId].js',
          },
          {
            file: 'users/[userId]/posts/[postId].js',
            page: '/users/[userId]/posts/[postId]',
            namedRegex: /^\/users\/(?<userId>[^/]+?)\/posts\/(?<postId>[^/]+?)\/?$/,
            routeKeys: { userId: 'userId', postId: 'postId' },
            loader: '_expo/loaders/users/[userId]/posts/[postId].js',
          },
          {
            file: 'docs/[...slug].js',
            page: '/docs/[...slug]',
            namedRegex: /^\/docs\/(?<slug>.+?)\/?$/,
            routeKeys: { slug: 'slug' },
            loader: '_expo/loaders/docs/[...slug].js',
          },
        ],
        apiRoutes: [],
        notFoundRoutes: [],
        redirects: [],
        rewrites: [],
      };

      const getLoaderData = jest.fn(async () => ({ data: 'loaded' }));

      const handler = createRequestHandler({
        getRoutesManifest: jest.fn(async () => manifest),
        getHtml: jest.fn(async () => '<html></html>'),
        getApiRoute: jest.fn(),
        getMiddleware: jest.fn(),
        getLoaderData,
      });

      let request = new Request('http://localhost/_expo/loaders/posts/123');
      let response = await handler(request);
      const [singleParamRequest] = getLoaderData.mock.calls[0];
      expect(response.status).toBe(200);
      expect(new URL(singleParamRequest.url).pathname).toBe('/posts/123');

      request = new Request('http://localhost/_expo/loaders/users/123/posts/456');
      response = await handler(request);
      const [nestedParamsRequest] = getLoaderData.mock.calls[1];
      expect(response.status).toBe(200);
      expect(new URL(nestedParamsRequest.url).pathname).toBe('/users/123/posts/456');

      request = new Request('http://localhost/_expo/loaders/docs/foo/bar/baz/quud');
      response = await handler(request);
      const [catchAllRequest] = getLoaderData.mock.calls[2];
      expect(response.status).toBe(200);
      expect(new URL(catchAllRequest.url).pathname).toBe('/docs/foo/bar/baz/quud');
    });

    it('returns 404 for loader requests to a route without loader', async () => {
      const manifest: Manifest = {
        htmlRoutes: [
          {
            file: 'index.js',
            page: '/',
            namedRegex: /^\/(?:index)?\/?$/,
            routeKeys: {},
          },
        ],
        apiRoutes: [],
        notFoundRoutes: [],
        redirects: [],
        rewrites: [],
      };

      const handler = createRequestHandler({
        getRoutesManifest: jest.fn(async () => manifest),
        getHtml: jest.fn(async () => '<html></html>'),
        getApiRoute: jest.fn(),
        getMiddleware: jest.fn(),
        getLoaderData: jest.fn(),
      });

      const request = new Request('http://localhost/_expo/loaders/');
      const response = await handler(request);

      expect(response.status).toBe(404);
    });

    it('does not treat regular HTML requests as loader requests', async () => {
      const manifest: Manifest = {
        htmlRoutes: [
          {
            file: 'second.js',
            page: '/second',
            namedRegex: /^\/second\/?$/,
            routeKeys: {},
            loader: '_expo/loaders/second.js',
          },
        ],
        apiRoutes: [],
        notFoundRoutes: [],
        redirects: [],
        rewrites: [],
      };

      const getHtml = jest.fn(async () => '<html>Second Page</html>');
      const getLoaderData = jest.fn(async () => ({ data: 'loader' }));

      const handler = createRequestHandler({
        getRoutesManifest: jest.fn(async () => manifest),
        getHtml,
        getApiRoute: jest.fn(),
        getMiddleware: jest.fn(),
        getLoaderData,
      });

      const request = new Request('http://localhost/second');
      const response = await handler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      expect(await response.text()).toBe('<html>Second Page</html>');
      expect(getHtml).toHaveBeenCalledTimes(1);
      expect(getLoaderData).not.toHaveBeenCalled();
    });
  });
});
