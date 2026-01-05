import type { MiddlewareInfo, RawManifest, RouteInfo } from '../../../manifest';
import { createEnvironment } from '../common';

describe('getRoutesManifest', () => {
  it('loads and parses `routes.json`', async () => {
    const input = createMockInput({
      manifest: {
        htmlRoutes: [
          {
            file: './index.tsx',
            page: '/index',
            namedRegex: '^/(?:/)?$',
          },
        ],
      },
    });
    const env = createEnvironment(input);

    const manifest = await env.getRoutesManifest();

    expect(input.readJson).toHaveBeenCalledWith('_expo/routes.json');
    expect(manifest.htmlRoutes).toHaveLength(1);
  });

  it('converts `namedRegex` strings to RegExp instances', async () => {
    const input = createMockInput({
      manifest: {
        htmlRoutes: [
          {
            file: './index.tsx',
            page: '/index',
            namedRegex: '^/(?:/)?$',
          },
        ],
        apiRoutes: [
          {
            file: '_expo/functions/api.js',
            page: '/api',
            namedRegex: '^/api(?:/)?$',
          },
        ],
        notFoundRoutes: [
          {
            file: './+not-found.tsx',
            page: '/+not-found',
            namedRegex: '^.*$',
          },
        ],
      },
    });
    const env = createEnvironment(input);

    const manifest = await env.getRoutesManifest();

    expect(manifest.htmlRoutes[0].namedRegex).toBeInstanceOf(RegExp);
    expect(manifest.apiRoutes[0].namedRegex).toBeInstanceOf(RegExp);
    expect(manifest.notFoundRoutes[0].namedRegex).toBeInstanceOf(RegExp);
  });
});

describe('getHtml', () => {
  it('reads static HTML file by route', async () => {
    const route = {
      file: './about.tsx',
      page: '/about',
      namedRegex: '^/about$',
    };
    const input = createMockInput({
      files: {
        '/about.html': '<html>Static content</html>',
      },
      manifest: { htmlRoutes: [route] },
    });
    const env = createEnvironment(input);

    const html = await env.getHtml(
      new Request('http://localhost/about'),
      createMockRoute({
        ...route,
        namedRegex: new RegExp(route.namedRegex),
      })
    );

    expect(input.readText).toHaveBeenCalledWith('/about.html');
    expect(html).toBe('<html>Static content</html>');
  });

  it('returns null when static file not found', async () => {
    const route = {
      file: './missing.tsx',
      page: '/missing',
      namedRegex: '^/missing$',
    };
    const input = createMockInput({
      manifest: { htmlRoutes: [route] },
    });
    const env = createEnvironment(input);

    const html = await env.getHtml(
      new Request('http://localhost/missing'),
      createMockRoute({
        ...route,
        namedRegex: new RegExp(route.namedRegex),
      })
    );

    expect(html).toBeNull();
  });

  it('handles index path hoisting', async () => {
    const route = {
      file: './foo/index.tsx',
      page: '/foo/index',
      namedRegex: '^/foo(/)?$',
    };
    const input = createMockInput({
      files: {
        '/foo/index.html': null,
        '/foo.html': '<html>Hoisted</html>',
      },
      manifest: { htmlRoutes: [route] },
    });
    const env = createEnvironment(input);

    const html = await env.getHtml(
      new Request('http://localhost/foo'),
      createMockRoute({
        ...route,
        namedRegex: new RegExp(route.namedRegex),
      })
    );

    expect(input.readText).toHaveBeenNthCalledWith(1, '/foo/index.html');
    expect(input.readText).toHaveBeenNthCalledWith(2, '/foo.html');
    expect(html).toBe('<html>Hoisted</html>');
  });

  it('does not hoist root index path', async () => {
    const route = {
      file: './index.tsx',
      page: '/index',
      namedRegex: '^/(?:/)?$',
    };
    const input = createMockInput({
      manifest: { htmlRoutes: [route] },
    });
    const env = createEnvironment(input);

    await env.getHtml(
      new Request('http://localhost/'),
      createMockRoute({
        ...route,
        namedRegex: new RegExp(route.namedRegex),
      })
    );

    expect(input.readText).toHaveBeenCalledTimes(1);
    expect(input.readText).toHaveBeenCalledWith('/index.html');
  });
});

describe('getApiRoute', () => {
  it('loads module by route file path', async () => {
    const route = {
      file: '_expo/functions/api+api.js',
      page: '/api',
      namedRegex: '^/api$',
    };
    const mockModule = { GET: jest.fn() };
    const input = createMockInput({
      modules: {
        '_expo/functions/api+api.js': mockModule,
      },
      manifest: { apiRoutes: [route] },
    });
    const env = createEnvironment(input);

    const module = await env.getApiRoute(
      createMockRoute({
        ...route,
        namedRegex: new RegExp(route.namedRegex),
      })
    );

    expect(input.loadModule).toHaveBeenCalledWith('_expo/functions/api+api.js');
    expect(module).toBe(mockModule);
  });
});

describe('getMiddleware', () => {
  const middlewareFile = '_expo/functions/+middleware.js';

  it('returns module when default export is a function', async () => {
    const middlewareModule = { default: jest.fn() };
    const input = createMockInput({
      modules: {
        [middlewareFile]: middlewareModule,
      },
      manifest: { middleware: { file: middlewareFile } },
    });
    const env = createEnvironment(input);

    const middleware = await env.getMiddleware({ file: middlewareFile });

    expect(middleware).toBe(middlewareModule);
  });

  it('returns null when default export is not a function', async () => {
    const middlewareModule = { default: 'not a function' };
    const input = createMockInput({
      modules: {
        [middlewareFile]: middlewareModule,
      },
      manifest: { middleware: { file: middlewareFile } },
    });
    const env = createEnvironment(input);

    const middleware = await env.getMiddleware({ file: middlewareFile });

    expect(middleware).toBeNull();
  });

  it('returns null when module has no default export', async () => {
    const middlewareModule = { named: jest.fn() };
    const input = createMockInput({
      modules: {
        [middlewareFile]: middlewareModule,
      },
      manifest: { middleware: { file: middlewareFile } },
    });
    const env = createEnvironment(input);

    const middleware = await env.getMiddleware({ file: middlewareFile });

    expect(middleware).toBeNull();
  });
});

type PartialRoute = Partial<RouteInfo<string>>;

function createMockManifest({
  htmlRoutes = [],
  apiRoutes = [],
  notFoundRoutes = [],
  redirects = [],
  rewrites = [],
  ...rest
}: {
  htmlRoutes?: PartialRoute[];
  apiRoutes?: PartialRoute[];
  notFoundRoutes?: PartialRoute[];
  redirects?: PartialRoute[];
  rewrites?: PartialRoute[];
  middleware?: MiddlewareInfo;
} = {}): RawManifest {
  return {
    htmlRoutes: htmlRoutes.map(createMockRoute),
    apiRoutes: apiRoutes.map(createMockRoute),
    notFoundRoutes: notFoundRoutes.map(createMockRoute),
    redirects: redirects.map(createMockRoute),
    rewrites: rewrites.map(createMockRoute),
    ...rest,
  };
}

function createMockInput({
  files = {},
  modules = {},
  manifest = {},
}: {
  files?: Record<string, string | null>;
  modules?: Record<string, unknown>;
  manifest?: Parameters<typeof createMockManifest>[0];
} = {}) {
  return {
    readText: jest.fn().mockImplementation((path: string) => Promise.resolve(files[path] ?? null)),
    readJson: jest.fn().mockResolvedValue(createMockManifest(manifest)),
    loadModule: jest
      .fn()
      .mockImplementation((path: string) => Promise.resolve(modules[path] ?? null)),
  };
}

function createMockRoute<T extends string | RegExp = string>(
  overrides?: Partial<RouteInfo<T>>
): RouteInfo<T> {
  return {
    file: '',
    page: '',
    namedRegex: '' as T,
    routeKeys: {},
    ...overrides,
  };
}
