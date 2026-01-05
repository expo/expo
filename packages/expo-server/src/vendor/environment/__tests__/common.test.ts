import type {
  AssetInfo,
  MiddlewareInfo,
  RawManifest,
  RenderingConfiguration,
  RouteInfo,
} from '../../../manifest';
import type { ServerRenderModule } from '../../../rendering';
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

  it('caches the manifest on subsequent calls', async () => {
    const input = createMockInput();
    const env = createEnvironment(input);

    await env.getRoutesManifest();
    await env.getRoutesManifest();

    expect(input.readJson).toHaveBeenCalledTimes(1);
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
    expect(input.loadModule).not.toHaveBeenCalled();
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

  it('uses SSR renderer when `rendering.mode === "ssr"`', async () => {
    const mockSsrModule = createMockSSRModule();
    const input = createMockInput({
      manifest: {
        rendering: { mode: 'ssr', file: '_expo/server/render.js' },
        assets: { css: [], js: ['/app.js'] },
      },
      modules: { '_expo/server/render.js': mockSsrModule },
    });
    const env = createEnvironment(input);

    const html = await env.getHtml(
      new Request('http://localhost/'),
      createMockRoute({
        file: './index.tsx',
        page: '/index',
        namedRegex: new RegExp('^/(?:/)?$'),
      })
    );

    expect(html).toBe('<html>SSR content</html>');
    expect(input.loadModule).toHaveBeenCalledWith('_expo/server/render.js');
    expect(input.readText).not.toHaveBeenCalled();
  });

  it('throws when SSR module fails to load', async () => {
    const input = createMockInput({
      manifest: {
        rendering: { mode: 'ssr', file: '_expo/server/render.js' },
      },
    });
    const env = createEnvironment(input);

    await expect(
      env.getHtml(
        new Request('http://localhost/'),
        createMockRoute({
          file: './index.tsx',
          page: '/index',
          namedRegex: new RegExp('^/(?:/)?$'),
        })
      )
    ).rejects.toThrow(/SSR module not found/);
  });

  it('caches SSR renderer on subsequent calls', async () => {
    const mockSSRModule = createMockSSRModule();
    const input = createMockInput({
      manifest: {
        rendering: { mode: 'ssr', file: '_expo/server/render.js' },
        assets: { css: [], js: ['/app.js'] },
      },
      modules: { '_expo/server/render.js': mockSSRModule },
    });
    const env = createEnvironment(input);

    await env.getHtml(
      new Request('http://localhost/'),
      createMockRoute({
        file: './index.tsx',
        page: '/index',
        namedRegex: new RegExp('^/(?:/)?$'),
      })
    );
    await env.getHtml(
      new Request('http://localhost/'),
      createMockRoute({
        file: './other.tsx',
        page: '/other',
        namedRegex: new RegExp('^/other(?:/)?$'),
      })
    );

    expect(input.loadModule).toHaveBeenCalledTimes(1);
  });

  it('passes location, request, and assets to `getStaticContent()`', async () => {
    const mockSSRModule = createMockSSRModule();
    const input = createMockInput({
      manifest: {
        rendering: { mode: 'ssr', file: '_expo/server/render.js' },
        assets: { css: ['/style.css'], js: ['/app.js'] },
      },
      modules: { '_expo/server/render.js': mockSSRModule },
    });
    const env = createEnvironment(input);
    const request = new Request('http://localhost/path?query=1');

    await env.getHtml(
      request,
      createMockRoute({
        file: './path.tsx',
        page: '/path',
        namedRegex: new RegExp('^/path(?:/)?$'),
      })
    );

    expect(mockSSRModule.getStaticContent).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/path',
        search: '?query=1',
      }),
      expect.objectContaining({
        request,
        assets: { css: ['/style.css'], js: ['/app.js'] },
      })
    );
  });

  it('logs and re-throws SSR render errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const renderError = new Error('Render failed');
    const mockSSRModule = {
      getStaticContent: jest.fn().mockRejectedValue(renderError),
    };
    const input = createMockInput({
      manifest: {
        rendering: { mode: 'ssr', file: '_expo/server/render.js' },
        assets: { css: [], js: ['/app.js'] },
      },
      modules: { '_expo/server/render.js': mockSSRModule },
    });
    const env = createEnvironment(input);

    await expect(
      env.getHtml(
        new Request('http://localhost/'),
        createMockRoute({
          file: './index.tsx',
          page: '/index',
          namedRegex: new RegExp('^/(?:/)?$'),
        })
      )
    ).rejects.toThrow('Render failed');

    expect(consoleErrorSpy).toHaveBeenCalledWith('SSR render error:', renderError);
    consoleErrorSpy.mockRestore();
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
  rendering?: RenderingConfiguration;
  assets?: AssetInfo;
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

function createMockSSRModule(): ServerRenderModule {
  return {
    getStaticContent: jest.fn().mockResolvedValue('<html>SSR content</html>'),
  };
}
