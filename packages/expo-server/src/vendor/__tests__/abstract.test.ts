import type { Manifest } from '../../manifest';
import { createRequestHandler, type RequestHandlerInput } from '../abstract';

describe(createRequestHandler, () => {
  it('returns streamed HTML responses for matched routes', async () => {
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
    };

    const handler = createRequestHandler({
      getRoutesManifest: jest.fn(async () => manifest),
      getHtml: jest.fn(async () => createHtmlStream('<html>streamed</html>')),
      getApiRoute: jest.fn(),
      getMiddleware: jest.fn(),
      getLoaderData: jest.fn(),
    });

    const response = await handler(new Request('http://localhost/'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/html');
    expect(await response.text()).toBe('<html>streamed</html>');
  });

  it('returns streamed 404 HTML responses for matched not-found routes', async () => {
    const manifest: Manifest = {
      htmlRoutes: [],
      apiRoutes: [],
      notFoundRoutes: [
        {
          file: 'not-found',
          page: '/404',
          namedRegex: /^\/.*$/,
          routeKeys: {},
        },
      ],
      redirects: [],
      rewrites: [],
    };

    const handler = createRequestHandler({
      getRoutesManifest: jest.fn(async () => manifest),
      getHtml: jest.fn(async () => createHtmlStream('<html>missing</html>')),
      getApiRoute: jest.fn(),
      getMiddleware: jest.fn(),
      getLoaderData: jest.fn(),
    });

    const response = await handler(new Request('http://localhost/missing'));

    expect(response.status).toBe(404);
    expect(response.headers.get('Content-Type')).toBe('text/html');
    expect(await response.text()).toBe('<html>missing</html>');
  });

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

  it('does not mutate the API route response when applying headers', async () => {
    const manifest: Manifest = {
      htmlRoutes: [],
      apiRoutes: [
        {
          file: 'api.js',
          page: '/api',
          namedRegex: /^\/api\/?$/,
          routeKeys: {},
        },
      ],
      notFoundRoutes: [],
      redirects: [],
      rewrites: [],
      headers: { 'X-Global': 'global' },
    };
    const apiResponse = new Response('{}', {
      headers: { 'Content-Type': 'application/json' },
    });

    const handler = createRequestHandler({
      getRoutesManifest: jest.fn(async () => manifest),
      getHtml: jest.fn(),
      getApiRoute: jest.fn(async () => ({ GET: async () => apiResponse })),
      getMiddleware: jest.fn(),
      getLoaderData: jest.fn(),
    });

    const response = await handler(new Request('http://localhost/api'));

    expect(response.headers.get('X-Global')).toBe('global');
    expect(apiResponse.headers.get('X-Global')).toBeNull();
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
      const getLoaderData = jest.fn(async (request: Request) => Response.json(loaderData));

      const handler = createRequestHandler({
        getRoutesManifest: jest.fn(async () => manifest),
        getHtml: jest.fn(async () => '<html></html>'),
        getApiRoute: jest.fn(),
        getMiddleware: jest.fn(),
        getLoaderData,
      });

      const request = new Request('http://localhost/_expo/loaders/second');
      const response = await handler(request);

      const [loaderRequest] = getLoaderData.mock.calls[0]!;
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(await response.json()).toEqual(loaderData);
      expect(new URL(loaderRequest.url).pathname).toBe('/second');
    });

    it('passes a loader-declared Cache-Control through verbatim', async () => {
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
      const handler = createRequestHandler({
        getRoutesManifest: jest.fn(async () => manifest),
        getHtml: jest.fn(),
        getApiRoute: jest.fn(),
        getMiddleware: jest.fn(),
        getLoaderData: jest.fn(async () =>
          Response.json({}, { headers: { 'Cache-Control': 'no-cache, private' } })
        ),
      });

      const response = await handler(new Request('http://localhost/_expo/loaders/second'));

      expect(response.headers.get('Cache-Control')).toBe('no-cache, private');
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

      const getLoaderData = jest.fn(async (request: Request) => Response.json({}));

      const handler = createRequestHandler({
        getRoutesManifest: jest.fn(async () => manifest),
        getHtml: jest.fn(async () => '<html></html>'),
        getApiRoute: jest.fn(),
        getMiddleware: jest.fn(),
        getLoaderData,
      });

      const request = new Request('http://localhost/_expo/loaders/about?foo=bar');
      await handler(request);

      const [loaderRequest] = getLoaderData.mock.calls[0]!;
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

      const getLoaderData = jest.fn(async (request: Request) => Response.json('loaded'));

      const handler = createRequestHandler({
        getRoutesManifest: jest.fn(async () => manifest),
        getHtml: jest.fn(async () => '<html></html>'),
        getApiRoute: jest.fn(),
        getMiddleware: jest.fn(),
        getLoaderData,
      });

      let request = new Request('http://localhost/_expo/loaders/posts/123');
      let response = await handler(request);
      const [singleParamRequest] = getLoaderData.mock.calls[0]!;
      expect(response.status).toBe(200);
      expect(new URL(singleParamRequest.url).pathname).toBe('/posts/123');

      request = new Request('http://localhost/_expo/loaders/users/123/posts/456');
      response = await handler(request);
      const [nestedParamsRequest] = getLoaderData.mock.calls[1]!;
      expect(response.status).toBe(200);
      expect(new URL(nestedParamsRequest.url).pathname).toBe('/users/123/posts/456');

      request = new Request('http://localhost/_expo/loaders/docs/foo/bar/baz/quud');
      response = await handler(request);
      const [catchAllRequest] = getLoaderData.mock.calls[2]!;
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
      const getLoaderData = jest.fn(async (request: Request) => Response.json('loader'));

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

    it('normalizes `/_expo/loaders/index` to match the index route', async () => {
      const manifest: Manifest = {
        htmlRoutes: [
          {
            file: 'index.js',
            page: '/',
            namedRegex: /^\/(?:index)?\/?$/,
            routeKeys: {},
            loader: '_expo/loaders/index.js',
          },
        ],
        apiRoutes: [],
        notFoundRoutes: [],
        redirects: [],
        rewrites: [],
      };

      const loaderData = { message: 'Index loader data' };
      const getLoaderData = jest.fn(async (request: Request) => Response.json(loaderData));

      const handler = createRequestHandler({
        getRoutesManifest: jest.fn(async () => manifest),
        getHtml: jest.fn(async () => '<html></html>'),
        getApiRoute: jest.fn(),
        getMiddleware: jest.fn(),
        getLoaderData,
      });

      const request = new Request('http://localhost/_expo/loaders/index');
      const response = await handler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(await response.json()).toEqual(loaderData);

      const [loaderRequest] = getLoaderData.mock.calls[0]!;
      expect(new URL(loaderRequest.url).pathname).toBe('/');
    });

    it('normalizes nested routes ending with `/index` for loader requests', async () => {
      const manifest: Manifest = {
        htmlRoutes: [
          {
            file: 'nested/index.js',
            page: '/nested',
            namedRegex: /^\/nested\/?$/,
            routeKeys: {},
            loader: '_expo/loaders/nested/index.js',
          },
        ],
        apiRoutes: [],
        notFoundRoutes: [],
        redirects: [],
        rewrites: [],
      };

      const loaderData = { page: 'nested' };
      const getLoaderData = jest.fn(async (request: Request) => Response.json(loaderData));

      const handler = createRequestHandler({
        getRoutesManifest: jest.fn(async () => manifest),
        getHtml: jest.fn(async () => '<html></html>'),
        getApiRoute: jest.fn(),
        getMiddleware: jest.fn(),
        getLoaderData,
      });

      const request = new Request('http://localhost/_expo/loaders/nested/index');
      const response = await handler(request);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(loaderData);

      const [loaderRequest] = getLoaderData.mock.calls[0]!;
      expect(new URL(loaderRequest.url).pathname).toBe('/nested/');
    });
  });

  describe('pageHeaders', () => {
    function createHandler(manifest: Manifest, overrides: Partial<RequestHandlerInput> = {}) {
      return createRequestHandler({
        getRoutesManifest: jest.fn(async () => manifest),
        getHtml: jest.fn(async () => '<html></html>'),
        getApiRoute: jest.fn(),
        getMiddleware: jest.fn(),
        getLoaderData: jest.fn(),
        ...overrides,
      });
    }

    const indexRoute = {
      file: 'index',
      page: '/',
      namedRegex: /^\/$/,
      routeKeys: {},
    };

    it('applies matching `pageHeaders` to response', async () => {
      const handler = createHandler({
        htmlRoutes: [indexRoute],
        apiRoutes: [],
        notFoundRoutes: [],
        redirects: [],
        rewrites: [],
        pageHeaders: [
          { namedRegex: /^\/$/, headers: { 'X-Frame-Options': 'DENY' } },
          {
            namedRegex: /^\/other$/,
            headers: { 'X-Frame-Options': 'SAMEORIGIN' },
          },
        ],
      });

      const response = await handler(new Request('http://localhost/'));

      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    });

    it('leaves response untouched when no rule matches', async () => {
      const handler = createHandler({
        htmlRoutes: [indexRoute],
        apiRoutes: [],
        notFoundRoutes: [],
        redirects: [],
        rewrites: [],
        pageHeaders: [{ namedRegex: /^\/other$/, headers: { 'X-Test': 'no' } }],
      });

      const response = await handler(new Request('http://localhost/'));

      expect(response.headers.get('X-Test')).toBeNull();
    });

    it('applies scalar precedence: route-authored, later rules, earlier rules, globals', async () => {
      const handler = createHandler({
        htmlRoutes: [indexRoute],
        apiRoutes: [],
        notFoundRoutes: [],
        redirects: [],
        rewrites: [],
        headers: { 'X-Powered-By': 'expo-server', 'X-Global': 'global' },
        pageHeaders: [
          {
            namedRegex: /^\/$/,
            headers: {
              'X-Rule': 'first',
              'X-Powered-By': 'page-override',
              'Content-Type': 'text/plain',
            },
          },
          { namedRegex: /^\/$/, headers: { 'X-Rule': 'second' } },
        ],
      });

      const response = await handler(new Request('http://localhost/'));

      expect(response.headers.get('Content-Type')).toBe('text/html');
      expect(response.headers.get('X-Rule')).toBe('second');
      expect(response.headers.get('X-Powered-By')).toBe('page-override');
      expect(response.headers.get('X-Global')).toBe('global');
    });

    it('appends array headers in global, page-rule order', async () => {
      const handler = createHandler({
        htmlRoutes: [indexRoute],
        apiRoutes: [],
        notFoundRoutes: [],
        redirects: [],
        rewrites: [],
        headers: { 'Set-Cookie': ['global=1'] },
        pageHeaders: [
          { namedRegex: /^\/$/, headers: { 'Set-Cookie': ['page1=1'] } },
          { namedRegex: /^\/$/, headers: { 'Set-Cookie': ['page2=1'] } },
        ],
      });

      const response = await handler(new Request('http://localhost/'));

      expect(response.headers.get('Set-Cookie')).toBe('global=1, page1=1, page2=1');
    });

    it('accumulates array headers', async () => {
      const handler = createHandler({
        htmlRoutes: [indexRoute],
        apiRoutes: [],
        notFoundRoutes: [],
        redirects: [],
        rewrites: [],
        headers: { 'Set-Cookie': ['session=1'] },
        pageHeaders: [{ namedRegex: /^\/$/, headers: { 'Set-Cookie': ['a=1', 'b=2'] } }],
      });

      const response = await handler(new Request('http://localhost/'));

      expect(response.headers.get('Set-Cookie')).toBe('session=1, a=1, b=2');
    });

    it('applies only global headers to API routes and loader requests, and none to redirects', async () => {
      const handler = createHandler(
        {
          htmlRoutes: [
            {
              file: 'blog.js',
              page: '/blog',
              namedRegex: /^\/blog\/?$/,
              routeKeys: {},
              loader: '_expo/loaders/blog.js',
            },
          ],
          apiRoutes: [
            {
              file: 'api.js',
              page: '/api',
              namedRegex: /^\/api\/?$/,
              routeKeys: {},
            },
          ],
          notFoundRoutes: [],
          redirects: [{ file: '', page: '/new', namedRegex: /^\/red\/?$/, routeKeys: {} }],
          rewrites: [],
          headers: {
            'X-Global': 'global',
            'Set-Cookie': ['global=1'],
            'Cache-Control': 'public, max-age=60',
          },
          pageHeaders: [
            {
              namedRegex: /^\/api\/?$/,
              headers: { 'X-Rule': 'set', 'Set-Cookie': ['page=1'] },
            },
            { namedRegex: /^\/blog\/?$/, headers: { 'X-Rule': 'set' } },
            { namedRegex: /^\/red\/?$/, headers: { 'X-Rule': 'set' } },
          ],
        },
        {
          getApiRoute: jest.fn(async () => ({
            GET: async () =>
              new Response('{}', {
                headers: {
                  'Content-Type': 'application/json',
                  'Set-Cookie': 'route=1',
                  'Cache-Control': 'max-age=10',
                },
              }),
          })),
          getLoaderData: jest.fn(
            async () =>
              new Response('{}', {
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-store',
                },
              })
          ),
        }
      );

      // API routes only receive global headers, and route-declared headers win over them
      const apiResponse = await handler(new Request('http://localhost/api'));
      expect(apiResponse.headers.get('X-Rule')).toBeNull();
      expect(apiResponse.headers.get('X-Global')).toBe('global');
      expect(apiResponse.headers.get('Set-Cookie')).toBe('route=1, global=1');
      expect(apiResponse.headers.get('Content-Type')).toBe('application/json');
      expect(apiResponse.headers.get('Cache-Control')).toBe('max-age=10');

      // Loader requests only receive global headers, and loader-declared headers win over them
      const loaderResponse = await handler(new Request('http://localhost/_expo/loaders/blog'));
      expect(loaderResponse.status).toBe(200);
      expect(loaderResponse.headers.get('X-Rule')).toBeNull();
      expect(loaderResponse.headers.get('X-Global')).toBe('global');
      expect(loaderResponse.headers.get('Cache-Control')).toBe('no-store');

      // Redirects receive neither global nor page headers
      const redirectResponse = await handler(new Request('http://localhost/red'));
      expect(redirectResponse.status).toBe(302);
      expect(redirectResponse.headers.get('Location')).toBe('/new');
      expect(redirectResponse.headers.get('X-Rule')).toBeNull();
      expect(redirectResponse.headers.get('X-Global')).toBeNull();
    });

    it('matches the requested path, not the rewritten target', async () => {
      const handler = createHandler({
        htmlRoutes: [
          {
            file: 'new',
            page: '/new',
            namedRegex: /^\/new\/?$/,
            routeKeys: {},
          },
        ],
        apiRoutes: [],
        notFoundRoutes: [],
        redirects: [],
        rewrites: [{ file: '', page: '/new', namedRegex: /^\/old\/?$/, routeKeys: {} }],
        pageHeaders: [
          { namedRegex: /^\/old\/?$/, headers: { 'X-Matched': 'old' } },
          { namedRegex: /^\/new\/?$/, headers: { 'X-Matched': 'new' } },
        ],
      });

      const response = await handler(new Request('http://localhost/old'));

      expect(response.headers.get('X-Matched')).toBe('old');
    });

    it('leaves passthrough dev error responses untouched', async () => {
      const handler = createHandler(
        {
          htmlRoutes: [indexRoute],
          apiRoutes: [],
          notFoundRoutes: [],
          redirects: [],
          rewrites: [],
          headers: { 'X-Global': 'global' },
          pageHeaders: [{ namedRegex: /^\/$/, headers: { 'X-Page': 'page' } }],
        },
        {
          getHtml: jest.fn(
            async () =>
              new Response('<html>error</html>', {
                status: 500,
                headers: { 'Content-Type': 'text/html' },
              })
          ),
        }
      );

      const response = await handler(new Request('http://localhost/'));

      expect(response.status).toBe(500);
      expect(response.headers.get('X-Global')).toBeNull();
      expect(response.headers.get('X-Page')).toBeNull();
    });
  });
});

function createHtmlStream(html: string): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(html));
      controller.close();
    },
  });
}
