import { getConfig } from '@expo/config';
import type { ChangeEvent } from '@expo/metro/metro-file-map/flow-types';
import type MetroServer from '@expo/metro/metro/Server';
import { ImmutableRequest } from 'expo-server/private';
import { fs, vol } from 'memfs';

import type { ExportAssetMap } from '../../../../export/saveAssets';
import { getEnvFiles, reloadEnvFiles } from '../../../../utils/nodeEnv';
import type { BundlerStartOptions } from '../../BundlerDevServer';
import { getPlatformBundlers } from '../../platformBundlers';
import { MetroBundlerDevServer } from '../MetroBundlerDevServer';
import { createRouteHandlerMiddleware } from '../createServerRouteMiddleware';
import { instantiateMetroAsync } from '../instantiateMetro';
import { HAS_LOGGED_SYMBOL, IS_METRO_BUNDLE_ERROR_SYMBOL } from '../metroErrorInterface';
import { warnInvalidWebOutput } from '../router';
import { observeAnyFileChanges, observeFileChanges } from '../waitForMetroToObserveTypeScriptFile';

jest.mock('../waitForMetroToObserveTypeScriptFile', () => ({
  observeAnyFileChanges: jest.fn(),
  observeFileChanges: jest.fn(),
}));
jest.mock('../../../../utils/nodeEnv', () => ({
  getEnvFiles: jest.fn(() => []),
  reloadEnvFiles: jest.fn(),
}));
jest.mock('../router', () => {
  return {
    ...jest.requireActual<any>('../router'),
    // Prevent memoization between tests
    hasWarnedAboutApiRoutes() {
      return false;
    },
    warnInvalidWebOutput: jest.fn(),
  };
});
jest.mock('@expo/config', () => ({
  getConfig: jest.fn(() => ({
    pkg: {},
    exp: {
      sdkVersion: '45.0.0',
      name: 'my-app',
      slug: 'my-app',
    },
  })),
}));
jest.mock('../instantiateMetro', () => ({
  instantiateMetroAsync: jest.fn(async () => ({
    metro: { _config: {}, _bundler: {} },
    middleware: { use: jest.fn() },
    server: { listen: jest.fn(), close: jest.fn() },
  })),
}));

jest.mock('../createServerRouteMiddleware', () => ({
  createRouteHandlerMiddleware: jest.fn(() => jest.fn()),
}));

jest.mock('../../middleware/mutations');
jest.mock('../../../../log');

beforeEach(() => {
  vol.reset();
  delete process.env.REACT_NATIVE_PACKAGER_HOSTNAME;
  delete process.env.EXPO_PACKAGER_PROXY_URL;
});

const htmlRoute = {
  file: './posts/[postId].tsx',
  page: '/posts/[postId]',
  namedRegex: /^\/posts\/(?<postId>[^/]+?)\/?$/i,
  routeKeys: { postId: 'postId' },
};

const rawServerManifest = {
  apiRoutes: [],
  htmlRoutes: [
    {
      file: './posts/[postId].tsx',
      page: '/posts/[postId]',
      namedRegex: '^/posts/(?<postId>[^/]+?)/?$',
      routeKeys: { postId: 'postId' },
    },
  ],
  notFoundRoutes: [],
  redirects: [],
  rewrites: [],
};

function createDevServerForStaticPageTests() {
  vol.fromJSON(
    {
      '/index.js': '',
      '/package.json': JSON.stringify({ main: 'index.js' }),
    },
    '/'
  );

  const devServer = new MetroBundlerDevServer(
    '/',
    getPlatformBundlers('/', { web: { bundler: 'metro' } })
  );
  devServer['instanceMetroOptions'] = {
    mode: 'development',
    isExporting: false,
    clientBoundaries: [],
    baseUrl: '',
    reactCompiler: false,
    routerRoot: 'app',
    asyncRoutes: false,
  };
  devServer['getDevServerUrlOrAssert'] = jest.fn(() => 'http://localhost:8081');
  return devServer;
}

describe('Metro error reporting', () => {
  it.each([true, false])(
    'reports only the final outcome after validating serializer output (valid: %s)',
    async (valid) => {
      const devServer = createDevServerForStaticPageTests();
      const update = jest.fn();
      const revision = {
        id: 'revision',
        date: new Date(),
        prepend: [],
        graph: { dependencies: new Map() },
      };
      devServer['metro'] = {
        _config: {
          transformer: { asyncRequireModulePath: 'asyncRequire' },
          serializer: { getModulesRunBeforeMainModule: () => [] },
          server: {},
        },
        _reporter: { update },
        _shouldAddModuleToIgnoreList: () => false,
        _resolveRelativePath: async () => '/app/asyncRequire.js',
        getNewBuildNumber: () => 1,
        getBundler: () => ({
          updateGraph: async () => ({ revision, delta: { reset: true, added: new Map() } }),
        }),
      } as any;
      devServer['getMetroRevision'] = jest.fn().mockResolvedValue(revision);
      devServer['getMetroSerializer'] = jest
        .fn()
        .mockReturnValue(async () =>
          valid ? { artifacts: [{ type: 'js', source: 'code' }], assets: [] } : {}
        );
      const result = devServer['_bundleDirectAsync']('/app/index.js', {
        transformOptions: {
          dev: true,
          minify: false,
          platform: 'web',
          type: 'module',
          unstable_transformProfile: 'default',
        },
        resolverOptions: { customResolverOptions: {}, dev: true },
        graphOptions: { lazy: false, shallow: false },
        serializerOptions: { output: 'static' } as any,
      });
      if (valid) {
        await expect(result).resolves.toMatchObject({ bundle: 'code' });
        expect(update.mock.calls.map(([event]) => event.type)).toEqual([
          'bundle_build_started',
          'bundle_build_done',
        ]);
      } else {
        await expect(result).rejects.toMatchObject({
          message: expect.stringContaining('Serializer did not return expected format'),
          [IS_METRO_BUNDLE_ERROR_SYMBOL]: true,
        });
        expect(update.mock.calls.map(([event]) => event.type)).toEqual([
          'bundle_build_started',
          'bundle_build_failed',
          'bundling_error',
        ]);
      }
    }
  );

  it.each(['bundleApiRoute', 'bundleLoader'] as const)(
    '%s preserves reporting flags when wrapping an error',
    async (method) => {
      const devServer = createDevServerForStaticPageTests();
      const error = Object.assign(new Error('transform failed'), {
        [IS_METRO_BUNDLE_ERROR_SYMBOL]: true,
        [HAS_LOGGED_SYMBOL]: true,
      });
      devServer['ssrLoadModuleContents'] = jest.fn().mockRejectedValue(error);
      await expect(devServer[method]('/app/index.ts', { platform: 'web' })).rejects.toMatchObject({
        [IS_METRO_BUNDLE_ERROR_SYMBOL]: true,
        [HAS_LOGGED_SYMBOL]: true,
      });
    }
  );

  it('preserves reporting flags when loader execution wraps a bundle failure', async () => {
    const devServer = createDevServerForStaticPageTests();
    const error = Object.assign(new Error('transform failed'), {
      [IS_METRO_BUNDLE_ERROR_SYMBOL]: true,
      [HAS_LOGGED_SYMBOL]: true,
    });
    devServer['ssrLoadModule'] = jest.fn().mockRejectedValue(error);
    await expect(
      devServer.executeServerDataLoaderAsync(new URL('http://localhost/'), {
        file: 'index.ts',
        params: {},
      } as any)
    ).rejects.toMatchObject({
      [IS_METRO_BUNDLE_ERROR_SYMBOL]: true,
      [HAS_LOGGED_SYMBOL]: true,
    });
  });
});

async function getStartedDevServer(options: Partial<BundlerStartOptions> = {}) {
  const devServer = new MetroBundlerDevServer(
    '/',
    getPlatformBundlers('/', { web: { bundler: 'metro' } })
  );
  // Tested in the superclass
  devServer['postStartAsync'] = jest.fn(async () => {});
  devServer['startImplementationAsync'] = jest.fn(devServer['startImplementationAsync']);
  // The port is always resolved by the caller before the dev server starts.
  await devServer.startAsync({ location: {}, port: 3000, ...options });
  return devServer;
}

describe('getStaticRenderFunctionAsync', () => {
  afterEach(() => {
    jest.mocked(getConfig).mockReturnValue({
      pkg: {},
      exp: { sdkVersion: '45.0.0', name: 'my-app', slug: 'my-app' },
    } as unknown as ReturnType<typeof getConfig>);
  });

  it('uses static streaming for static export', async () => {
    jest.mocked(getConfig).mockReturnValue({
      pkg: {},
      exp: {
        name: 'test',
        slug: 'test',
        web: { output: 'static' },
      },
    } as unknown as ReturnType<typeof getConfig>);

    const devServer = createDevServerForStaticPageTests();
    const getStreamingContent = jest.fn(async () => '<html>streamed SSG</html>');
    const resolvedMetadata = { metadata: { title: 'Post 123' }, headNodes: ['Post 123'] };
    const resolveMetadata = jest.fn(async () => resolvedMetadata);
    devServer['ssrLoadModule'] = jest.fn(async () => ({
      getStreamingContent,
      resolveMetadata,
      getManifest: async () => ({ screens: {} }),
      getBuildTimeServerManifestAsync: async () => rawServerManifest,
    })) as unknown as (typeof devServer)['ssrLoadModule'];

    const { renderAsync } = await devServer.getStaticRenderFunctionAsync();
    const options = {
      hydrate: true,
      loader: { data: { postId: '123' }, key: '/posts/[postId]' },
      assets: { css: [{ type: 'css' as const, href: '/app.css' }], js: ['/app.js'] },
    };
    const runtimeRoute = { contextKey: './posts/[postId].tsx' } as any;
    await expect(renderAsync('/posts/123', runtimeRoute, options)).resolves.toBe(
      '<html>streamed SSG</html>'
    );

    expect(resolveMetadata).toHaveBeenCalledWith({
      route: { file: './posts/[postId].tsx', page: '/posts/[postId]' },
      request: undefined,
      params: { postId: '123' },
    });
    expect(getStreamingContent).toHaveBeenCalledWith(new URL('http://localhost:8081/posts/123'), {
      ...options,
      metadata: resolvedMetadata,
      route: { file: './posts/[postId].tsx', page: '/posts/[postId]' },
      params: { postId: '123' },
      output: 'static',
    });

    const metadataError = new Error('metadata failed');
    resolveMetadata.mockRejectedValueOnce(metadataError);
    await expect(renderAsync('/posts/456', runtimeRoute, options)).rejects.toBe(metadataError);
    expect(getStreamingContent).toHaveBeenCalledTimes(1);

    resolveMetadata.mockClear();
    await renderAsync('/+not-found', { internal: true } as any, options);
    expect(resolveMetadata).not.toHaveBeenCalled();
    expect(getStreamingContent).toHaveBeenLastCalledWith(
      new URL('http://localhost:8081/+not-found'),
      {
        ...options,
        route: { file: undefined, page: '/+not-found', generated: true },
        params: {},
        output: 'static',
      }
    );
  });
});

describe('startAsync', () => {
  it.each([
    { output: 'static', pkg: {}, routeHandlerCalls: 0 },
    { output: 'server', pkg: {}, routeHandlerCalls: 0 },
    {
      output: 'static',
      pkg: { dependencies: { 'expo-router': '*' } },
      routeHandlerCalls: 1,
    },
    {
      output: 'server',
      pkg: { main: 'custom-entry.js', dependencies: { 'expo-router': '*' } },
      routeHandlerCalls: 1,
    },
    {
      output: 'server',
      pkg: { devDependencies: { 'expo-router': '*' } },
      routeHandlerCalls: 1,
    },
    {
      output: 'single',
      pkg: { dependencies: { 'expo-router': '*' } },
      routeHandlerCalls: 0,
    },
  ] as const)(
    'uses the Router handler $routeHandlerCalls times for $output output and $pkg',
    async ({ output, pkg, routeHandlerCalls }) => {
      jest.mocked(getConfig).mockReturnValue({
        pkg,
        exp: { name: 'test', slug: 'test', web: { output } },
      } as ReturnType<typeof getConfig>);
      jest.mocked(createRouteHandlerMiddleware).mockClear();

      await getStartedDevServer();

      expect(createRouteHandlerMiddleware).toHaveBeenCalledTimes(routeHandlerCalls);
    }
  );

  it(`starts metro`, async () => {
    const devServer = await getStartedDevServer();

    expect(devServer['postStartAsync']).toHaveBeenCalled();

    expect(devServer.getInstance()).toEqual({
      location: {
        host: 'localhost',
        port: 3000,
        protocol: 'http',
        url: 'http://localhost:3000',
      },
      middleware: {
        use: expect.any(Function),
      },
      server: {
        close: expect.any(Function),
        listen: expect.any(Function),
      },
    });

    expect(instantiateMetroAsync).toHaveBeenCalled();
    expect(instantiateMetroAsync).toHaveBeenCalledWith(
      devServer,
      expect.objectContaining({ port: 3000 }),
      expect.objectContaining({
        devToolsPluginManager: devServer['devToolsPluginManager'],
      })
    );
  });

  it(`listens on 127.0.0.1 with --localhost`, async () => {
    const devServer = await getStartedDevServer({ location: { hostType: 'localhost' } });

    expect(instantiateMetroAsync).toHaveBeenLastCalledWith(
      devServer,
      expect.objectContaining({ host: '127.0.0.1' }),
      expect.anything()
    );
  });

  it(`reports the resolved port, not the port the socket came back with`, async () => {
    jest.mocked(instantiateMetroAsync).mockResolvedValueOnce({
      metro: { _config: {}, _bundler: {} },
      middleware: { use: jest.fn() },
      server: { listen: jest.fn(), close: jest.fn() },
      address: { protocol: 'http', address: 'localhost', family: 'ipv4', port: 9999 },
    } as any);

    const devServer = await getStartedDevServer({ port: 3000 });

    expect(devServer.getInstance()!.location.port).toBe(3000);
    expect(devServer.getInstance()!.location.url).toBe('http://localhost:3000');
    expect(devServer.getUrlCreator().constructUrl({ hostType: 'localhost' })).toBe(
      'http://127.0.0.1:3000'
    );
  });
});

describe('watchEnvironmentVariables', () => {
  it('keeps the Metro mode when env files reload', async () => {
    const devServer = new MetroBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } })
    );
    devServer['instance'] = { server: {} } as any;
    devServer['metro'] = {} as any;
    devServer['instanceMetroOptions'] = { mode: 'production' };

    await devServer.watchEnvironmentVariables();

    expect(getEnvFiles).toHaveBeenCalledWith('/', 'production');
    jest.mocked(observeFileChanges).mock.calls[0]![2]();
    expect(reloadEnvFiles).toHaveBeenCalledWith('/', 'production');
  });
});

describe('watchConfig', () => {
  let watchFile: jest.SpyInstance;

  beforeEach(() => {
    watchFile = jest.spyOn(fs, 'watchFile').mockImplementation(() => ({ unref: jest.fn() }) as any);
  });

  afterEach(() => {
    watchFile.mockRestore();
  });

  // Every file that `@expo/metro-config/src/config/resolveMetroUserConfig.ts` can load a Metro config from.
  it.each([
    'metro.config.js',
    'metro.config.cjs',
    'metro.config.mjs',
    'metro.config.json',
    'metro.config.ts',
    'metro.config.cts',
    'metro.config.mts',
    '.config/metro.js',
    '.config/metro.ts',
  ])('watches %s for changes', (configFile) => {
    vol.fromJSON({ [`/${configFile}`]: '' }, '/');
    const devServer = new MetroBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } })
    );

    devServer['watchConfig']();

    expect(watchFile).toHaveBeenCalledWith(`/${configFile}`, expect.any(Function));
  });

  it('does not watch rn-cli.config.js, which `@expo/metro-config` never loads', () => {
    vol.fromJSON({ '/rn-cli.config.js': '' }, '/');
    const devServer = new MetroBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } })
    );

    devServer['watchConfig']();

    expect(watchFile).not.toHaveBeenCalled();
  });
});

describe('API Route output warning', () => {
  beforeEach(() => {
    vol.reset();
    jest.mocked(getConfig).mockClear();
    jest.mocked(warnInvalidWebOutput).mockClear();
  });

  async function mockMetroStatic() {
    vol.fromJSON(
      {
        'node_modules/expo-router/package.json': JSON.stringify({}),
      },
      '/'
    );
    jest.mocked(getConfig).mockReturnValue({
      // @ts-expect-error
      exp: {
        web: {
          bundler: 'metro',
          output: 'static',
        },
      },
      pkg: { dependencies: { 'expo-router': '*' } },
    });
  }
  async function setupDevServer() {
    let pCallback: ((events: ChangeEvent) => void | Promise<void>) | null = null;
    jest
      .mocked(observeAnyFileChanges)
      .mockClear()
      .mockImplementationOnce((server, callback) => {
        pCallback = callback;
        return jest.fn();
      });
    const devServer = await getStartedDevServer();

    expect(devServer['postStartAsync']).toHaveBeenCalled();
    expect(devServer['startImplementationAsync']).toHaveBeenCalled();

    expect(observeAnyFileChanges).toHaveBeenCalled();
    expect(pCallback).toBeDefined();
    return pCallback!;
  }

  it(`warns when output is not server and an API route is created`, async () => {
    mockMetroStatic();
    const callback = await setupDevServer();
    callback({
      changes: {
        addedDirectories: [],
        removedDirectories: [],
        addedFiles: [['/app/foo+api.ts', { isSymlink: false }]],
        modifiedFiles: [],
        removedFiles: [],
      },
      rootDir: '/',
    });
    expect(warnInvalidWebOutput).toHaveBeenCalled();
  });

  it(`does not warn about invalid output when API route is being deleted`, async () => {
    mockMetroStatic();
    const callback = await setupDevServer();
    callback({
      changes: {
        addedDirectories: [],
        removedDirectories: [],
        addedFiles: [],
        modifiedFiles: [],
        removedFiles: [['/app/foo+api.ts', { isSymlink: false }]],
      },
      rootDir: '/',
    });
    expect(warnInvalidWebOutput).not.toHaveBeenCalled();

    // Sanity to ensure test works — adding an API route should warn.
    callback({
      changes: {
        addedDirectories: [],
        removedDirectories: [],
        addedFiles: [['/app/foo+api.ts', { isSymlink: false }]],
        modifiedFiles: [],
        removedFiles: [],
      },
      rootDir: '/',
    });
    expect(warnInvalidWebOutput).toHaveBeenCalled();
  });

  it(`does not warn about invalid output when file is not a valid API route`, async () => {
    mockMetroStatic();
    const callback = await setupDevServer();
    callback({
      changes: {
        addedDirectories: [],
        removedDirectories: [],
        addedFiles: [['/app/foo.ts', { isSymlink: false }]],
        modifiedFiles: [],
        removedFiles: [],
      },
      rootDir: '/',
    });
    expect(warnInvalidWebOutput).not.toHaveBeenCalled();
  });

  it(`does not warn about invalid output when file is outside of routes directory`, async () => {
    mockMetroStatic();
    const callback = await setupDevServer();
    callback({
      changes: {
        addedDirectories: [],
        removedDirectories: [],
        addedFiles: [['/other/foo+api.js', { isSymlink: false }]],
        modifiedFiles: [],
        removedFiles: [],
      },
      rootDir: '/',
    });
    expect(warnInvalidWebOutput).not.toHaveBeenCalled();
  });
});

describe('getStaticPageAsync', () => {
  beforeEach(() => {
    jest.mocked(getConfig).mockReturnValue({
      pkg: {},
      exp: {
        name: 'test',
        slug: 'test',
        web: {
          output: 'server',
        },
      },
    } as unknown as ReturnType<typeof getConfig>);
  });

  it('returns a ReadableStream for server output', async () => {
    const devServer = createDevServerForStaticPageTests();
    const stream = new ReadableStream<Uint8Array>();
    const getStreamingContent = jest.fn(async () => stream);
    const resolveMetadata = jest.fn(async () => null);
    const ssrLoadModule = jest.fn(async () => ({
      getStreamingContent,
      resolveMetadata,
    }));
    const getStaticResourcesAsync = jest.fn(async () => ({
      artifacts: [
        {
          type: 'css-external',
          filename: 'https://example.com/font.css',
          originFilename: 'app/global.css',
          source: '',
          metadata: {},
        },
        {
          type: 'css',
          filename: '_expo/static/css/app.css',
          originFilename: 'app/global.css',
          source: 'body { color: red; }',
          metadata: { hmrId: 'app_global_css' },
        },
        {
          type: 'css-external',
          filename: 'https://example.com/route.css',
          originFilename: 'app/route.css',
          source: '',
          metadata: { media: 'screen' },
        },
        {
          type: 'css',
          filename: '_expo/static/css/route.css',
          originFilename: 'app/route.css',
          source: 'body { color: blue; }',
          metadata: { hmrId: 'app_route_css' },
        },
      ],
    }));

    devServer['ssrLoadModule'] = ssrLoadModule as unknown as (typeof devServer)['ssrLoadModule'];
    devServer['getStaticResourcesAsync'] = getStaticResourcesAsync as any;

    const request = new ImmutableRequest(new Request('http://localhost:8081/posts/123'));
    const result = await devServer['getStaticPageAsync']('/posts/123', htmlRoute, request);

    expect(result).toEqual({ content: stream });
    expect(ssrLoadModule).toHaveBeenCalledWith(
      require.resolve('@expo/router-server/node/render.js'),
      {
        environment: 'node',
        minify: false,
        isExporting: false,
        platform: 'web',
      }
    );
    expect(getStreamingContent).toHaveBeenCalledWith(new URL('http://localhost:8081/posts/123'), {
      loader: undefined,
      metadata: null,
      request,
      route: { file: './posts/[postId].tsx', page: '/posts/[postId]' },
      params: { postId: '123' },
      assets: {
        css: [
          { type: 'external', href: 'https://example.com/font.css', media: undefined },
          { type: 'inline', source: 'body { color: red; }', hmrId: 'app_global_css' },
          { type: 'external', href: 'https://example.com/route.css', media: 'screen' },
          { type: 'inline', source: 'body { color: blue; }', hmrId: 'app_route_css' },
        ],
        js: [expect.stringContaining('/index.bundle?')],
      },
    });
  });

  it.each([false, true])(
    'renders development SSG without request data (incoming request: %s)',
    async (hasRequest) => {
      jest.mocked(getConfig).mockReturnValue({
        pkg: {},
        exp: {
          name: 'test',
          slug: 'test',
          web: { output: 'static' },
        },
      } as unknown as ReturnType<typeof getConfig>);

      const devServer = createDevServerForStaticPageTests();
      const getStreamingContent = jest.fn(async () => '<html>streamed SSG</html>');
      const resolvedMetadata = { metadata: { title: 'Post 123' }, headNodes: ['Post 123'] };
      const resolveMetadata = jest.fn(async () => resolvedMetadata);
      devServer['ssrLoadModule'] = jest.fn(async () => ({
        getStreamingContent,
        resolveMetadata,
      })) as unknown as (typeof devServer)['ssrLoadModule'];
      devServer['getStaticResourcesAsync'] = jest.fn(async () => ({ artifacts: [] })) as any;
      devServer.executeServerDataLoaderAsync = jest.fn(async () =>
        Response.json({ postId: '123' })
      ) as any;

      const request = hasRequest
        ? new ImmutableRequest(new Request('http://localhost:8081/posts/123'))
        : undefined;
      const result = await devServer['getStaticPageAsync']('/posts/123', htmlRoute, request);

      expect(result).toEqual({ content: '<html>streamed SSG</html>', resources: [] });
      expect(resolveMetadata).toHaveBeenCalledWith({
        route: { file: './posts/[postId].tsx', page: '/posts/[postId]' },
        request: undefined,
        params: { postId: '123' },
      });
      expect(devServer.executeServerDataLoaderAsync).toHaveBeenCalledWith(
        new URL('http://localhost:8081/posts/123'),
        expect.objectContaining({ params: { postId: '123' } }),
        undefined
      );
      expect(getStreamingContent).toHaveBeenCalledWith(new URL('http://localhost:8081/posts/123'), {
        loader: { data: { postId: '123' }, key: '/posts/123' },
        metadata: resolvedMetadata,
        route: { file: './posts/[postId].tsx', page: '/posts/[postId]' },
        params: { postId: '123' },
        output: 'static',
        hydrate: false,
        assets: {
          css: [],
          js: [expect.stringContaining('/index.bundle?')],
          favicon: undefined,
        },
      });
    }
  );

  it.each([
    ['static', '/_sitemap', 'expo-router/build/views/Sitemap.js'],
    ['static', '/missing', 'expo-router/build/views/Unmatched.js'],
    ['server', '/_sitemap', 'expo-router/build/views/Sitemap.js'],
    ['server', '/missing', 'expo-router/build/views/Unmatched.js'],
  ])('%s output renders generated route %s', async (output, pathname, file) => {
    jest.mocked(getConfig).mockReturnValue({
      pkg: {},
      exp: { name: 'test', slug: 'test', web: { output } },
    } as unknown as ReturnType<typeof getConfig>);

    const devServer = createDevServerForStaticPageTests();
    const html = '<html>Generated route</html>';
    devServer['ssrLoadModule'] = jest.fn(async () => ({
      getStreamingContent: async () => (output === 'server' ? new Response(html).body : html),
      resolveMetadata: async ({ route }: { route: { file: string } }) => {
        throw new Error(`Cannot find module '${route.file}' in the app context`);
      },
    })) as unknown as (typeof devServer)['ssrLoadModule'];
    devServer['getStaticResourcesAsync'] = jest.fn(async () => ({ artifacts: [] })) as any;

    const { content } = await devServer['getStaticPageAsync'](
      pathname,
      { file, page: pathname, generated: true, routeKeys: {}, namedRegex: /^\/.*$/ },
      output === 'server'
        ? new ImmutableRequest(new Request(`http://localhost:8081${pathname}`))
        : undefined
    );

    expect(typeof content === 'string' ? content : await new Response(content).text()).toBe(html);
  });

  it('normalizes loader Response data and passes dynamic params to metadata', async () => {
    jest.mocked(getConfig).mockReturnValue({
      pkg: {},
      exp: {
        name: 'test',
        slug: 'test',
        web: {
          output: 'server',
        },
      },
    } as unknown as ReturnType<typeof getConfig>);

    const devServer = createDevServerForStaticPageTests();
    devServer.executeServerDataLoaderAsync = jest.fn(async () =>
      Response.json({ postId: '123' })
    ) as any;
    const request = new ImmutableRequest(new Request('http://localhost:8081/posts/123'));
    const resolveMetadata = jest.fn(async () => ({ headNodes: [] }));

    const result = await devServer['getDevServerRenderOptionsAsync']({
      location: new URL('http://localhost:8081/posts/123'),
      route: htmlRoute,
      request,
      resolveMetadata: resolveMetadata as any,
    });

    expect(result).toEqual({
      params: { postId: '123' },
      route: { file: './posts/[postId].tsx', page: '/posts/[postId]' },
      metadata: { headNodes: [] },
      loader: {
        data: { postId: '123' },
        key: '/posts/123',
      },
    });
    expect(resolveMetadata).toHaveBeenCalledWith({
      route: {
        file: './posts/[postId].tsx',
        page: '/posts/[postId]',
      },
      request,
      params: { postId: '123' },
    });
  });

  it('throws when streaming SSR is missing a request', async () => {
    const devServer = createDevServerForStaticPageTests();

    await expect(devServer['getStaticPageAsync']('/posts/123', htmlRoute)).rejects.toThrow(
      'development streaming SSR requires a request'
    );
  });
});

describe('executeServerDataLoaderAsync', () => {
  it('only forwards allowlisted loader `Response` headers in SSG', async () => {
    jest.mocked(getConfig).mockReturnValue({
      pkg: {},
      exp: {
        name: 'test',
        slug: 'test',
        web: {
          output: 'static',
        },
      },
    } as unknown as ReturnType<typeof getConfig>);

    const devServer = createDevServerForStaticPageTests();
    devServer['ssrLoadModule'] = jest.fn(async () => ({
      loader: async () =>
        Response.json(
          { foo: 'bar' },
          {
            headers: {
              'Cache-Control': 'public, max-age=3600',
              'X-Custom-Header': 'test-value',
            },
          }
        ),
    })) as unknown as (typeof devServer)['ssrLoadModule'];

    const response = await devServer.executeServerDataLoaderAsync(
      new URL('http://localhost:8081/posts/123'),
      {
        file: './posts/[postId].tsx',
        contextKey: '/posts/[postId]',
        pathname: '/posts/123',
        params: { postId: '123' },
      }
    );

    expect(response?.headers.get('Cache-Control')).toBe('public, max-age=3600');
    expect(response?.headers.get('X-Custom-Header')).toBeNull();
    await expect(response!.json()).resolves.toEqual({ foo: 'bar' });
  });
});

describe('exportServerRouteAsync', () => {
  it('rewrites only the trailing source map directive', async () => {
    // https://github.com/expo/expo/issues/47960
    const devServer = new MetroBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } })
    );
    const files: ExportAssetMap = new Map();

    const src = [
      `const n='This is string data, not a comment.\\n//# sourceMappingURL=embedded.js.map\\nEnd of data.';`,
      '//# sourceMappingURL=index.map',
    ].join('\n');

    await devServer['exportServerRouteAsync']({
      contents: {
        src,
        map: JSON.stringify({ version: 3, sources: [], names: [], mappings: '' }),
      },
      artifactFilename: '_expo/server/render.js',
      files,
      includeSourceMaps: true,
      descriptor: {},
    });

    expect(files.get('_expo/server/render.js')?.contents).toBe(
      [
        `const n='This is string data, not a comment.\\n//# sourceMappingURL=embedded.js.map\\nEnd of data.';`,
        '//# sourceMappingURL=render.js.map',
      ].join('\n')
    );
    expect(files.has('_expo/server/render.js.map')).toBe(true);
  });
});

describe('server graph listeners', () => {
  type FakeGraph = { transformOptions: { platform: string } };
  type FakeRevision = { id: string; graphId: string; graph: FakeGraph };

  // A fake `IncrementalBundler`: `changed` holds the graphs the next update reports a delta for.
  function createFakeBundler() {
    const revisions = new Map<string, FakeRevision>();
    const listeners = new Set<() => void>();
    const changed = new Set<FakeGraph>();
    let nextId = 0;

    const addRevision = (graphId: string, graph: FakeGraph): FakeRevision => {
      const revision = { id: `rev-${nextId++}`, graphId, graph };
      revisions.set(revision.id, revision);
      return revision;
    };
    // Like `IncrementalBundler.updateGraph`, replaces the revision with a new one.
    const advanceRevision = (revision: FakeRevision): FakeRevision => {
      revisions.delete(revision.id);
      return addRevision(revision.graphId, revision.graph);
    };
    const bundler = {
      getRevision: (id: string) => (revisions.has(id) ? Promise.resolve(revisions.get(id)) : null),
      getRevisionByGraphId: (graphId: string) => {
        const latest = [...revisions.values()].filter((r) => r.graphId === graphId).pop();
        return latest ? Promise.resolve(latest) : null;
      },
      updateGraph: jest.fn(async (revision: FakeRevision) => {
        const delta = {
          added: new Map(),
          modified: new Map(changed.has(revision.graph) ? [['/changed.js', {}]] : []),
          deleted: new Set(),
        };
        changed.delete(revision.graph);
        return { revision: advanceRevision(revision), delta };
      }),
      getDeltaBundler: () => ({
        listen: (_graph: FakeGraph, listener: () => void) => {
          listeners.add(listener);
          return () => listeners.delete(listener);
        },
      }),
    };
    return {
      bundler,
      revisions,
      addRevision,
      advanceRevision,
      createGraph: (platform: string): FakeGraph => ({ transformOptions: { platform } }),
      // Emits one file change batch to every listener, as `DeltaCalculator`s do.
      emitChange(touched: FakeGraph[]) {
        touched.forEach((graph) => changed.add(graph));
        listeners.forEach((listener) => listener());
      },
    };
  }

  function createDevServerWithBundler(fake: ReturnType<typeof createFakeBundler>) {
    const devServer = new MetroBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } })
    );
    const reporter = { update: jest.fn() };
    devServer['metro'] = {
      getBundler: () => fake.bundler,
      _reporter: reporter,
    } as unknown as MetroServer;
    const broadcastMessage = jest.fn();
    devServer.broadcastMessage = broadcastMessage;
    const onReloadRscEvent = jest.fn();
    devServer['onReloadRscEvent'] = onReloadRscEvent;
    const subscribe = async (graphId: string, graph: FakeGraph) => {
      const revision = fake.addRevision(graphId, graph);
      await devServer['setupServerGraphListener'](revision.id);
      return revision;
    };
    return { devServer, broadcastMessage, onReloadRscEvent, reporter, subscribe };
  }

  const clearRegistry = jest.fn();
  const debounce = () => jest.advanceTimersByTimeAsync(50);

  beforeEach(() => {
    jest.useFakeTimers();
    clearRegistry.mockClear();
    Object.assign(globalThis, { __c: clearRegistry });
  });
  afterEach(() => {
    jest.useRealTimers();
    Reflect.deleteProperty(globalThis, '__c');
  });

  it('reloads the graph platform only when a change reaches the graph', async () => {
    const fake = createFakeBundler();
    const { broadcastMessage, onReloadRscEvent, subscribe } = createDevServerWithBundler(fake);
    const graph = fake.createGraph('ios');
    await subscribe('graph-a', graph);

    fake.emitChange([]);
    await debounce();
    expect(fake.bundler.updateGraph).toHaveBeenCalledTimes(1);
    expect(broadcastMessage).not.toHaveBeenCalled();
    expect(clearRegistry).not.toHaveBeenCalled();

    fake.emitChange([graph]);
    await debounce();
    expect(clearRegistry).toHaveBeenCalledTimes(1);
    expect(onReloadRscEvent).toHaveBeenCalledWith('ios');
    expect(broadcastMessage.mock.calls).toEqual([
      ['sendDevCommand', { name: 'rsc-reload', platform: 'ios' }],
    ]);
  });

  it('updates each graph once for a burst of changes, and broadcasts once per platform', async () => {
    const fake = createFakeBundler();
    const { broadcastMessage, subscribe } = createDevServerWithBundler(fake);
    const graphs = [fake.createGraph('web'), fake.createGraph('web'), fake.createGraph('ios')];
    for (const [i, graph] of graphs.entries()) {
      await subscribe(`graph-${i}`, graph);
    }

    fake.emitChange(graphs);
    fake.emitChange([]);
    await debounce();
    expect(fake.bundler.updateGraph).toHaveBeenCalledTimes(3);
    expect(clearRegistry).toHaveBeenCalledTimes(1);
    expect(broadcastMessage.mock.calls).toEqual([
      ['sendDevCommand', { name: 'rsc-reload', platform: 'web' }],
      ['sendDevCommand', { name: 'rsc-reload', platform: 'ios' }],
    ]);
  });

  it('keeps the first graph registered for a graph ID', async () => {
    const fake = createFakeBundler();
    const { broadcastMessage, subscribe } = createDevServerWithBundler(fake);
    const first = fake.createGraph('web');
    const second = fake.createGraph('web');
    const firstRevision = await subscribe('graph-a', first);
    await subscribe('graph-a', second);

    fake.emitChange([second]);
    await debounce();
    expect(fake.bundler.updateGraph).toHaveBeenCalledTimes(1);
    expect(fake.bundler.updateGraph).toHaveBeenCalledWith(firstRevision, false);
    expect(broadcastMessage).not.toHaveBeenCalled();
  });

  it('follows the graph when another caller advances its revision', async () => {
    const fake = createFakeBundler();
    const { broadcastMessage, subscribe } = createDevServerWithBundler(fake);
    const graph = fake.createGraph('web');
    fake.advanceRevision(await subscribe('graph-a', graph));

    fake.emitChange([graph]);
    await debounce();
    expect(broadcastMessage).toHaveBeenCalledWith('sendDevCommand', {
      name: 'rsc-reload',
      platform: 'web',
    });
  });

  it('stops when the revision now belongs to a different graph', async () => {
    const fake = createFakeBundler();
    const { devServer, broadcastMessage, subscribe } = createDevServerWithBundler(fake);
    const graph = fake.createGraph('web');
    fake.revisions.delete((await subscribe('graph-a', graph)).id);
    fake.addRevision('graph-a', fake.createGraph('web'));

    fake.emitChange([graph]);
    await debounce();
    fake.emitChange([graph]);
    await debounce();
    expect(fake.bundler.updateGraph).not.toHaveBeenCalled();
    expect(broadcastMessage).not.toHaveBeenCalled();
    expect(devServer['serverGraphs'].has('graph-a')).toBe(false);
  });

  it('reports an update error and still updates the other graphs', async () => {
    const fake = createFakeBundler();
    const { broadcastMessage, reporter, subscribe } = createDevServerWithBundler(fake);
    const failing = fake.createGraph('web');
    const graph = fake.createGraph('ios');
    await subscribe('graph-a', failing);
    await subscribe('graph-b', graph);
    const error = new Error('SyntaxError');
    fake.bundler.updateGraph.mockRejectedValueOnce(error);

    fake.emitChange([failing, graph]);
    await debounce();
    expect(reporter.update).toHaveBeenCalledWith({ type: 'bundling_error', error });
    expect(broadcastMessage.mock.calls).toEqual([
      ['sendDevCommand', { name: 'rsc-reload', platform: 'ios' }],
    ]);
  });
});
