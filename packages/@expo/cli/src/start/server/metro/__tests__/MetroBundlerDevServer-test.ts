import { getConfig } from '@expo/config';
import type { ChangeEvent } from '@expo/metro/metro-file-map/flow-types';
import { ImmutableRequest } from 'expo-server/private';
import { vol } from 'memfs';

import type { ExportAssetMap } from '../../../../export/saveAssets';
import { getEnvFiles, reloadEnvFiles } from '../../../../utils/nodeEnv';
import type { BundlerStartOptions } from '../../BundlerDevServer';
import { evalMetroNoHandling } from '../../getStaticRenderFunctions';
import { getPlatformBundlers } from '../../platformBundlers';
import { MetroBundlerDevServer } from '../MetroBundlerDevServer';
import { instantiateMetroAsync } from '../instantiateMetro';
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
jest.mock('../../getStaticRenderFunctions', () => ({
  ...jest.requireActual('../../getStaticRenderFunctions'),
  evalMetroNoHandling: jest.fn(),
}));

jest.mock('../../middleware/mutations');
jest.mock('../../../../log');

beforeEach(() => {
  vol.reset();
  delete process.env.REACT_NATIVE_PACKAGER_HOSTNAME;
  delete process.env.EXPO_PACKAGER_PROXY_URL;
});

const htmlRoute = {
  file: 'posts/[postId].tsx',
  page: '/posts/[postId]',
  namedRegex: /^\/posts\/(?<postId>[^/]+?)\/?$/i,
  routeKeys: { postId: 'postId' },
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

describe('startAsync', () => {
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
        extra: {
          router: {
            unstable_useServerRendering: true,
          },
        },
      },
    } as unknown as ReturnType<typeof getConfig>);
  });

  it('returns a ReadableStream for non-RSC development SSR', async () => {
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
          type: 'css',
          filename: '_expo/static/css/app.css',
          originFilename: 'app/global.css',
          source: 'body { color: red; }',
          metadata: { hmrId: 'app_global_css' },
        },
        {
          type: 'css-external',
          filename: 'https://example.com/font.css',
          originFilename: 'app/global.css',
          source: '<link rel="stylesheet" href="https://example.com/font.css">',
          metadata: {},
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
      assets: {
        css: [],
        externalCss: [{ href: 'https://example.com/font.css' }],
        inlineCss: [{ source: 'body { color: red; }', hmrId: 'app_global_css' }],
        js: [expect.stringContaining('/index.bundle?')],
      },
    });
  });

  it('preserves the string HTML path when SSR streaming is disabled', async () => {
    jest.mocked(getConfig).mockReturnValue({
      pkg: {},
      exp: {
        name: 'test',
        slug: 'test',
        web: {
          output: 'static',
        },
        extra: {
          router: {
            unstable_useServerRendering: false,
          },
        },
      },
    } as unknown as ReturnType<typeof getConfig>);

    const devServer = createDevServerForStaticPageTests();
    const getStaticContent = jest.fn(async () => '<html><head></head><body></body></html>');
    devServer['ssrLoadModule'] = jest.fn(async () => ({
      getStaticContent,
    })) as unknown as (typeof devServer)['ssrLoadModule'];
    devServer['getStaticResourcesAsync'] = jest.fn(async () => ({ artifacts: [] })) as any;

    const result = await devServer['getStaticPageAsync']('/posts/123', htmlRoute);

    expect(typeof result.content).toBe('string');
    expect(result.resources).toEqual([]);
    expect(getStaticContent).toHaveBeenCalledWith(new URL('http://localhost:8081/posts/123'), {
      hydrate: false,
      assets: {
        css: [],
        js: [expect.stringContaining('/index.bundle?')],
        favicon: undefined,
      },
    });
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
        extra: {
          router: {
            unstable_useServerDataLoaders: true,
            unstable_useServerRendering: true,
          },
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
      metadata: { headNodes: [] },
      loader: {
        data: { postId: '123' },
        key: '/posts/123',
      },
    });
    expect(resolveMetadata).toHaveBeenCalledWith({
      route: {
        file: 'posts/[postId].tsx',
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
        extra: {
          router: {
            unstable_useServerDataLoaders: true,
          },
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
        file: 'posts/[postId].tsx',
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

describe('ssrImportApiRoute', () => {
  // https://github.com/expo/expo/issues/33857
  // In development, `ssrImportApiRoute` re-evaluated the API route module on every
  // request, resetting any module-scope state (e.g. counters, long-lived connections)
  // between requests, unlike the production `@expo/server` runtime which evaluates the
  // module once and reuses it.
  function setupApiRouteDevServer() {
    const devServer = createDevServerForStaticPageTests();
    devServer['ssrLoadModuleContents'] = jest.fn(async (filePath: string) => ({
      src: `module.exports = { GET: () => {} };`,
      filename: filePath,
      map: '',
    })) as any;
    jest.mocked(evalMetroNoHandling).mockClear();
    jest.mocked(evalMetroNoHandling).mockImplementation(() => ({ GET: jest.fn() }) as any);
    return devServer;
  }

  it('evaluates the module once and reuses it across requests', async () => {
    const devServer = setupApiRouteDevServer();

    const first = await devServer['ssrImportApiRoute']('/app/foo+api.ts', { platform: 'web' });
    const second = await devServer['ssrImportApiRoute']('/app/foo+api.ts', { platform: 'web' });

    expect(evalMetroNoHandling).toHaveBeenCalledTimes(1);
    expect(devServer['ssrLoadModuleContents']).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it('evaluates each API route file independently', async () => {
    const devServer = setupApiRouteDevServer();

    await devServer['ssrImportApiRoute']('/app/foo+api.ts', { platform: 'web' });
    await devServer['ssrImportApiRoute']('/app/bar+api.ts', { platform: 'web' });

    expect(evalMetroNoHandling).toHaveBeenCalledTimes(2);
  });

  it('re-evaluates the module after the route cache is invalidated', async () => {
    const devServer = setupApiRouteDevServer();

    await devServer['ssrImportApiRoute']('/app/foo+api.ts', { platform: 'web' });
    devServer['invalidateApiRouteCache']();
    await devServer['ssrImportApiRoute']('/app/foo+api.ts', { platform: 'web' });

    expect(evalMetroNoHandling).toHaveBeenCalledTimes(2);
  });
});
