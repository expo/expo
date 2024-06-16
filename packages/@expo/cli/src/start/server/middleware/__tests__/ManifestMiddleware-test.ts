import { getConfig } from '@expo/config';
import { vol } from 'memfs';

import * as Log from '../../../../log';
import * as ProjectDevices from '../../../project/devices';
import { getPlatformBundlers } from '../../platformBundlers';
import { createTemplateHtmlFromExpoConfigAsync } from '../../webTemplate';
import { ManifestMiddleware, ManifestRequestInfo } from '../ManifestMiddleware';
import { ServerHeaders, ServerRequest, ServerResponse } from '../server.types';

jest.mock('../../webTemplate', () => ({
  createTemplateHtmlFromExpoConfigAsync: jest.fn(async () => '<html />'),
}));
jest.mock('../../platformBundlers', () => ({
  getPlatformBundlers: jest.fn(jest.requireActual('../../platformBundlers').getPlatformBundlers),
}));

jest.mock('../../../../log');
jest.mock('../resolveAssets', () => ({
  resolveManifestAssets: jest.fn(),
  resolveGoogleServicesFile: jest.fn(),
}));
jest.mock('@expo/config/paths', () => ({
  resolveEntryPoint: jest.fn((projectRoot: string) =>
    require('path').join(projectRoot, './index.js')
  ),
}));
jest.mock('@expo/config', () => ({
  getNameFromConfig: jest.fn(jest.requireActual('@expo/config').getNameFromConfig),
  getProjectConfigDescriptionWithPaths: jest.fn(),
  getConfig: jest.fn(() => ({
    pkg: {},
    exp: {
      sdkVersion: '45.0.0',
      name: 'my-app',
      slug: 'my-app',
    },
  })),
}));
jest.mock('../../../project/devices', () => ({
  saveDevicesAsync: jest.fn(async () => ({})),
}));

class MockManifestMiddleware extends ManifestMiddleware<any> {
  public _getManifestResponseAsync(
    options: ManifestRequestInfo
  ): Promise<{ body: string; version: string; headers: ServerHeaders }> {
    throw new Error('Method not implemented.');
  }
  public getParsedHeaders(req: ServerRequest): ManifestRequestInfo {
    throw new Error('Method not implemented.');
  }
  protected trackManifest(version?: string): void {
    throw new Error('Method not implemented.');
  }
}

const asReq = (req: Partial<ServerRequest>) => req as ServerRequest;
const asRes = (res: Partial<ServerResponse>) => res as ServerResponse;

describe('checkBrowserRequestAsync', () => {
  const createConstructUrl = () =>
    jest.fn(({ scheme, hostname }) => `${scheme}://${hostname ?? 'localhost'}:8080`);

  it('handles browser requests when the web bundler is "metro" and no platform is specified', async () => {
    jest.mocked(getPlatformBundlers).mockReturnValueOnce({
      web: 'metro',
      ios: 'metro',
      android: 'metro',
    });

    jest.mocked(getConfig).mockReturnValueOnce(
      // @ts-expect-error
      {
        pkg: {},
        exp: {
          sdkVersion: '45.0.0',
          name: 'my-app',
          slug: 'my-app',
          platforms: ['ios', 'android', 'web'],
        },
      }
    );

    const middleware = new MockManifestMiddleware('/', {
      constructUrl: createConstructUrl(),
      mode: 'development',
    });

    const res = asRes({
      setHeader: jest.fn(),
      end: jest.fn(),
    });

    expect(
      await middleware.checkBrowserRequestAsync(
        asReq({ url: 'http://localhost:8080/', headers: {} }),
        res
      )
    ).toBe(true);

    expect(createTemplateHtmlFromExpoConfigAsync).toHaveBeenCalledWith('/', {
      exp: {
        name: 'my-app',
        sdkVersion: '45.0.0',
        slug: 'my-app',
        platforms: ['ios', 'android', 'web'],
      },
      scripts: [
        // NOTE(EvanBacon): Browsers won't pass the `expo-platform` header so we need to
        // provide the `platform=web` query parameter in order for the multi-platform dev server
        // to return the correct bundle.
        '/index.bundle?platform=web&dev=true&hot=false&transform.engine=hermes&transform.routerRoot=app',
      ],
    });
    expect(res.setHeader).toBeCalledWith('Content-Type', 'text/html');
    expect(res.end).toBeCalledWith('<html />');
  });

  it('skips handling browser requests when the web bundler is "webpack"', async () => {
    jest.mocked(getPlatformBundlers).mockReturnValueOnce({
      web: 'webpack',
      ios: 'metro',
      android: 'metro',
    });

    const middleware = new MockManifestMiddleware('/', {
      constructUrl: createConstructUrl(),
      mode: 'development',
    });

    const res = asRes({
      setHeader: jest.fn(),
      end: jest.fn(),
    });

    expect(
      await middleware.checkBrowserRequestAsync(
        asReq({ url: 'http://localhost:8080/', headers: {} }),
        res
      )
    ).toBe(false);
  });
});

describe('_getBundleUrl', () => {
  beforeEach(() => {
    vol.reset();
  });

  afterAll(() => {
    vol.reset();
  });

  const createConstructUrl = () =>
    jest.fn(({ scheme, hostname }) => `${scheme}://${hostname ?? 'localhost'}:8080`);
  it('returns the bundle url with the hostname', () => {
    const constructUrl = createConstructUrl();
    const middleware = new MockManifestMiddleware('/', { constructUrl, mode: 'development' });
    expect(
      middleware._getBundleUrl({
        hostname: 'evanbacon.dev',
        mainModuleName: 'index',
        platform: 'android',
      })
    ).toEqual('http://evanbacon.dev:8080/index.bundle?platform=android&dev=true&hot=false');

    expect(constructUrl).toHaveBeenCalledWith({ hostname: 'evanbacon.dev', scheme: 'http' });
  });
  it('returns the bundle url in production', () => {
    const constructUrl = createConstructUrl();
    const middleware = new MockManifestMiddleware('/', {
      constructUrl,
      mode: 'production',
      minify: true,
    });
    expect(
      middleware._getBundleUrl({
        mainModuleName: 'node_modules/expo/AppEntry',
        platform: 'ios',
      })
    ).toEqual(
      'http://localhost:8080/node_modules/expo/AppEntry.bundle?platform=ios&dev=false&hot=false&minify=true'
    );

    expect(constructUrl).toHaveBeenCalledWith({ hostname: undefined, scheme: 'http' });
  });

  it('returns the bundle url in production with lazy enabled', () => {
    vol.fromJSON(
      {
        'node_modules/@expo/metro-runtime/package.json': '',
      },
      '/'
    );
    const constructUrl = createConstructUrl();
    const middleware = new MockManifestMiddleware('/', {
      constructUrl,
      mode: 'production',
      minify: true,
    });
    expect(
      middleware._getBundleUrl({
        mainModuleName: 'node_modules/expo/AppEntry',
        platform: 'ios',
      })
    ).toEqual(
      'http://localhost:8080/node_modules/expo/AppEntry.bundle?platform=ios&dev=false&hot=false&lazy=true&minify=true'
    );

    expect(constructUrl).toHaveBeenCalledWith({ hostname: undefined, scheme: 'http' });
  });
});

describe('_resolveProjectSettingsAsync', () => {
  it(`returns the project settings for Metro dev servers`, async () => {
    const middleware = new MockManifestMiddleware('/', {
      constructUrl: jest.fn(() => 'http://fake.mock'),
      mode: 'development',
    });

    jest.mocked(getConfig).mockClear();

    middleware._getBundleUrl = jest.fn(() => 'http://fake.mock/index.bundle');

    const hostname = 'localhost';

    await expect(
      middleware._resolveProjectSettingsAsync({ hostname, platform: 'android' })
    ).resolves.toEqual({
      bundleUrl: 'http://fake.mock/index.bundle',
      exp: { name: 'my-app', sdkVersion: '45.0.0', slug: 'my-app' },
      expoGoConfig: {
        __flipperHack: 'React Native packager is running',
        debuggerHost: 'http://fake.mock',
        developer: { projectRoot: '/', tool: 'expo-cli' },
        mainModuleName: 'index',
        packagerOpts: { dev: true },
      },
      hostUri: 'http://fake.mock',
    });

    // Limit this to a single call since it can get expensive.
    expect(getConfig).toHaveBeenCalledTimes(1);
  });
  it(`returns the project settings for Webpack dev servers`, async () => {
    const middleware = new MockManifestMiddleware('/', {
      isNativeWebpack: true,
      constructUrl: jest.fn(() => 'http://fake.mock'),
      mode: 'production',
    });

    jest.mocked(getConfig).mockClear();

    middleware._getBundleUrl = jest.fn(() => 'http://fake.mock/index.bundle');

    const hostname = 'localhost';

    await expect(
      middleware._resolveProjectSettingsAsync({ hostname, platform: 'ios' })
    ).resolves.toEqual({
      bundleUrl: 'http://fake.mock/index.bundle',
      exp: { name: 'my-app', sdkVersion: '45.0.0', slug: 'my-app' },
      expoGoConfig: {
        __flipperHack: 'React Native packager is running',
        debuggerHost: 'http://fake.mock',
        developer: { projectRoot: '/', tool: 'expo-cli' },
        mainModuleName: 'index',
        packagerOpts: { dev: false },
      },
      hostUri: 'http://fake.mock',
    });

    // Limit this to a single call since it can get expensive.
    expect(getConfig).toHaveBeenCalledTimes(1);
  });
});

describe('getHandler', () => {
  it(`resolves successfully`, async () => {
    const middleware = new MockManifestMiddleware('/', {
      constructUrl: jest.fn(() => 'http://fake.mock'),
    });
    middleware['trackManifest'] = jest.fn();
    // @ts-expect-error
    middleware.getParsedHeaders = jest.fn(() => ({}));
    // @ts-expect-error
    middleware._getManifestResponseAsync = jest.fn(async () => ({
      body: 'body',
      version: '45.0.0',
      headers: [['header', 'value']],
    }));

    const handleAsync = middleware.getHandler();

    const next = jest.fn();

    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
      statusCode: 200,
    };

    await handleAsync(
      asReq({
        url: '/',
        headers: {
          'expo-dev-client-id': 'client-id',
        },
      }),
      // @ts-expect-error
      res,
      next
    );

    // Ensure that devices are stored successfully.
    expect(ProjectDevices.saveDevicesAsync).toBeCalledWith('/', 'client-id');

    // Internals are invoked.
    expect(middleware._getManifestResponseAsync).toBeCalled();
    expect(middleware['trackManifest']).toBeCalled();

    // Generally tests that the server I/O works as expected so we don't need to test this in subclasses.
    expect(res.statusCode).toEqual(200);
    expect(next).not.toBeCalled();
    expect(res.end).toBeCalledWith('body');
    expect(res.setHeader).toBeCalledWith('header', 'value');
  });

  it(`returns error info in the response`, async () => {
    const middleware = new MockManifestMiddleware('/', {
      constructUrl: jest.fn(() => 'http://fake.mock'),
    });
    middleware['trackManifest'] = jest.fn();
    // @ts-expect-error
    middleware.getParsedHeaders = jest.fn(() => ({}));
    middleware._getManifestResponseAsync = jest.fn(async () => {
      throw new Error('demo');
    });

    const handleAsync = middleware.getHandler();

    const next = jest.fn();

    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
      statusCode: 200,
    };

    await handleAsync(
      asReq({
        url: '/',
        headers: {
          'expo-dev-client-id': 'client-id',
        },
      }),
      // @ts-expect-error
      res,
      next
    );

    // Ensure that devices are stored successfully.
    expect(ProjectDevices.saveDevicesAsync).toBeCalledWith('/', 'client-id');

    // Internals are invoked.
    expect(middleware._getManifestResponseAsync).toBeCalled();

    // Don't track failures.
    expect(middleware['trackManifest']).not.toBeCalled();

    // Generally tests that the server I/O works as expected so we don't need to test this in subclasses.
    expect(res.statusCode).toEqual(500);

    expect(next).not.toBeCalled();
    // Returns error info.
    expect(res.end).toBeCalledWith(JSON.stringify({ error: 'Error: demo' }));
    // Ensure the user sees the error in the terminal.
    expect(Log.exception).toBeCalled();
  });
});
