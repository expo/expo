import { getConfig } from '@expo/config';
import type { ChangeEvent } from '@expo/metro/metro-file-map/flow-types';
import { ImmutableRequest } from 'expo-server/private';
import { vol } from 'memfs';

import type { BundlerStartOptions } from '../../BundlerDevServer';
import { getPlatformBundlers } from '../../platformBundlers';
import { MetroBundlerDevServer } from '../MetroBundlerDevServer';
import { instantiateMetroAsync } from '../instantiateMetro';
import { warnInvalidWebOutput } from '../router';
import { observeAnyFileChanges } from '../waitForMetroToObserveTypeScriptFile';

jest.mock('../waitForMetroToObserveTypeScriptFile', () => ({
  observeAnyFileChanges: jest.fn(),
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

jest.mock('../../middleware/mutations');
jest.mock('../../../../log');

beforeEach(() => {
  vol.reset();
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
  devServer['getAvailablePortAsync'] = jest.fn(() => Promise.resolve(3000));
  // Tested in the superclass
  devServer['postStartAsync'] = jest.fn(async () => {});
  devServer['startImplementationAsync'] = jest.fn(devServer['startImplementationAsync']);
  await devServer.startAsync({ location: {}, ...options });
  return devServer;
}

describe('startAsync', () => {
  it(`starts metro`, async () => {
    const devServer = await getStartedDevServer();

    expect(devServer['postStartAsync']).toHaveBeenCalled();

    expect(devServer.getInstance()).toEqual({
      location: {
        host: 'localhost',
        port: expect.any(Number),
        protocol: 'http',
        url: expect.stringMatching(/http:\/\/localhost:\d+/),
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
      // @ts-expect-error
      pkg: {},
      exp: {
        web: {
          output: 'server',
        },
        extra: {
          router: {
            unstable_useServerRendering: true,
          },
        },
      },
    });
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

    devServer['ssrLoadModule'] = ssrLoadModule;
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
        css: ['https://example.com/font.css'],
        inlineCss: [{ source: 'body { color: red; }', hmrId: 'app_global_css' }],
        js: [expect.stringContaining('/index.bundle?')],
      },
    });
  });

  it('preserves the string HTML path when SSR streaming is disabled', async () => {
    jest.mocked(getConfig).mockReturnValue({
      // @ts-expect-error
      pkg: {},
      exp: {
        web: {
          output: 'static',
        },
        extra: {
          router: {
            unstable_useServerRendering: false,
          },
        },
      },
    });

    const devServer = createDevServerForStaticPageTests();
    const getStaticContent = jest.fn(async () => '<html><head></head><body></body></html>');
    devServer['ssrLoadModule'] = jest.fn(async () => ({ getStaticContent }));
    devServer['getStaticResourcesAsync'] = jest.fn(async () => ({ artifacts: [] })) as any;

    const result = await devServer['getStaticPageAsync']('/posts/123', htmlRoute);

    expect(typeof result.content).toBe('string');
    expect(result.resources).toEqual([]);
    expect(getStaticContent).toHaveBeenCalledWith(
      new URL('http://localhost:8081/posts/123'),
      undefined
    );
  });

  it('normalizes loader Response data and passes dynamic params to metadata', async () => {
    jest.mocked(getConfig).mockReturnValue({
      // @ts-expect-error
      pkg: {},
      exp: {
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
    });

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
