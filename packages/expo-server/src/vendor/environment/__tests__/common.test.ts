import { ImmutableRequest } from '../../../ImmutableRequest';
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

  it('caches the manifest on subsequent calls in production', async () => {
    const input = createMockInput();
    const env = createEnvironment(input);

    await env.getRoutesManifest();
    await env.getRoutesManifest();

    expect(input.readJson).toHaveBeenCalledTimes(1);
  });

  it('does not cache the manifest in development', async () => {
    const input = createMockInput({ isDevelopment: true });
    const env = createEnvironment(input);

    await env.getRoutesManifest();
    await env.getRoutesManifest();

    expect(input.readJson).toHaveBeenCalledTimes(2);
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

  it('returns `null` when static file not found', async () => {
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

  it('caches SSR renderer on subsequent calls in production', async () => {
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

  it('does not cache SSR renderer in development', async () => {
    const mockSSRModule = createMockSSRModule();
    const input = createMockInput({
      isDevelopment: true,
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

    expect(input.loadModule).toHaveBeenCalledTimes(2);
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

  it('merges top-level and per-route assets', async () => {
    const mockSSRModule = createMockSSRModule();
    const input = createMockInput({
      manifest: {
        rendering: { mode: 'ssr', file: '_expo/server/render.js' },
        assets: { css: ['/global.css'], js: ['/runtime.js', '/entry.js'] },
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
        assets: { css: [], js: ['/layout-chunk.js', '/index-chunk.js'] },
      })
    );

    expect(mockSSRModule.getStaticContent).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        assets: {
          css: ['/global.css'],
          js: ['/runtime.js', '/entry.js', '/layout-chunk.js', '/index-chunk.js'],
        },
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

  it('executes loader and passes data to SSR renderer', async () => {
    const loaderData = { message: 'Hello from loader' };
    const loaderModule = { loader: jest.fn().mockResolvedValue(loaderData) };
    const mockSSRModule = createMockSSRModule();
    const input = createMockInput({
      manifest: {
        rendering: { mode: 'ssr', file: '_expo/server/render.js' },
        assets: { css: [], js: ['/app.js'] },
        htmlRoutes: [
          {
            file: './index.tsx',
            page: '/index',
            namedRegex: '^/(?:/)?$',
            loader: '_expo/loaders/index.js',
          },
        ],
      },
      modules: {
        '_expo/server/render.js': mockSSRModule,
        '_expo/loaders/index.js': loaderModule,
      },
    });
    const env = createEnvironment(input);

    await env.getHtml(
      new Request('http://localhost/'),
      createMockRoute({
        file: './index.tsx',
        page: '/index',
        namedRegex: new RegExp('^/(?:/)?$'),
        loader: '_expo/loaders/index.js',
      })
    );

    expect(input.loadModule).toHaveBeenCalledWith('_expo/loaders/index.js');
    expect(loaderModule.loader).toHaveBeenCalledWith(expect.any(ImmutableRequest), {});
    expect(mockSSRModule.getStaticContent).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        loader: { key: '/index', data: loaderData },
      })
    );
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

  it('returns `null` when default export is not a function', async () => {
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

  it('returns `null` when module has no default export', async () => {
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

describe('getLoaderData', () => {
  it('returns `Response` with loader data when route has loader', async () => {
    const loaderData = { userId: 123 };
    const loaderModule = { loader: jest.fn().mockResolvedValue(loaderData) };
    const input = createMockInput({
      modules: { '_expo/loaders/user.js': loaderModule },
    });
    const env = createEnvironment(input);

    const result = await env.getLoaderData(
      new Request('http://localhost/user'),
      createMockRoute({
        file: './user.tsx',
        page: '/user',
        namedRegex: new RegExp('^/user(?:/)?$'),
        loader: '_expo/loaders/user.js',
      })
    );

    expect(result).toBeInstanceOf(Response);
    expect(await result.json()).toEqual(loaderData);
    expect(loaderModule.loader).toHaveBeenCalledWith(expect.any(ImmutableRequest), {});
  });

  it('returns `Response` with `null` body when route has no loader', async () => {
    const input = createMockInput();
    const env = createEnvironment(input);

    const result = await env.getLoaderData(
      new Request('http://localhost/about'),
      createMockRoute({
        file: './about.tsx',
        page: '/about',
        namedRegex: new RegExp('^/about(?:/)?$'),
      })
    );

    expect(result).toBeInstanceOf(Response);
    expect(await result.json()).toBeNull();
  });

  it('throws when loader module fails to load', async () => {
    const input = createMockInput();
    const env = createEnvironment(input);

    await expect(
      env.getLoaderData(
        new Request('http://localhost/broken'),
        createMockRoute({
          file: './broken.tsx',
          page: '/broken',
          namedRegex: new RegExp('^/broken(?:/)?$'),
          loader: '_expo/loaders/broken.js',
        })
      )
    ).rejects.toThrow(/Loader module not found/);
  });

  it('parses params correctly for dynamic routes', async () => {
    const loaderModule = { loader: jest.fn().mockResolvedValue({ found: true }) };
    const input = createMockInput({
      modules: { '_expo/loaders/posts/[id].js': loaderModule },
    });
    const env = createEnvironment(input);

    await env.getLoaderData(
      new Request('http://localhost/posts/123'),
      createMockRoute({
        file: './posts/[id].tsx',
        page: '/posts/[id]',
        namedRegex: new RegExp('^/posts/(?<id>[^/]+?)(?:/)?$'),
        routeKeys: { id: 'id' },
        loader: '_expo/loaders/posts/[id].js',
      })
    );

    expect(loaderModule.loader).toHaveBeenCalledWith(expect.any(ImmutableRequest), { id: '123' });
  });

  it('normalizes `undefined` loader result to `null`', async () => {
    const loaderModule = { loader: jest.fn().mockResolvedValue(undefined) };
    const input = createMockInput({
      modules: { '_expo/loaders/undefined-route.js': loaderModule },
    });
    const env = createEnvironment(input);

    const result = await env.getLoaderData(
      new Request('http://localhost/undefined-route'),
      createMockRoute({
        file: './undefined-route.tsx',
        page: '/undefined-route',
        namedRegex: new RegExp('^/undefined-route(?:/)?$'),
        loader: '_expo/loaders/undefined-route.js',
      })
    );

    expect(result).toBeInstanceOf(Response);
    expect(await result.json()).toBeNull();
  });

  it('passes through `null` loader result as `null`', async () => {
    const loaderModule = { loader: jest.fn().mockResolvedValue(null) };
    const input = createMockInput({
      modules: { '_expo/loaders/null-route.js': loaderModule },
    });
    const env = createEnvironment(input);

    const result = await env.getLoaderData(
      new Request('http://localhost/null-route'),
      createMockRoute({
        file: './null-route.tsx',
        page: '/null-route',
        namedRegex: new RegExp('^/null-route(?:/)?$'),
        loader: '_expo/loaders/null-route.js',
      })
    );

    expect(result).toBeInstanceOf(Response);
    expect(await result.json()).toBeNull();
  });

  it('returns `Response` directly when loader returns `Response`', async () => {
    const responseData = { test: 'response' };
    const loaderResponse = Response.json(responseData, {
      headers: { 'X-Custom': 'value' },
    });
    const loaderModule = { loader: jest.fn().mockResolvedValue(loaderResponse) };
    const input = createMockInput({
      modules: { '_expo/loaders/response-route.js': loaderModule },
    });
    const env = createEnvironment(input);

    const result = await env.getLoaderData(
      new Request('http://localhost/response-route'),
      createMockRoute({
        file: './response-route.tsx',
        page: '/response-route',
        namedRegex: new RegExp('^/response-route(?:/)?$'),
        loader: '_expo/loaders/response-route.js',
      })
    );

    expect(result).toBeInstanceOf(Response);
    expect(result.headers.get('X-Custom')).toBe('value');
    expect(await result.json()).toEqual(responseData);
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
  isDevelopment = false,
}: {
  files?: Record<string, string | null>;
  modules?: Record<string, unknown>;
  manifest?: Parameters<typeof createMockManifest>[0];
  isDevelopment?: boolean;
} = {}) {
  return {
    readText: jest.fn().mockImplementation((path: string) => Promise.resolve(files[path] ?? null)),
    readJson: jest.fn().mockResolvedValue(createMockManifest(manifest)),
    loadModule: jest
      .fn()
      .mockImplementation((path: string) => Promise.resolve(modules[path] ?? null)),
    isDevelopment,
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
