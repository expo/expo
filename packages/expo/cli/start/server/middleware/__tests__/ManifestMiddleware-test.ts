import { getConfig } from '@expo/config';

import * as Log from '../../../../log';
import * as ProjectDevices from '../../../project/ProjectDevices';
import { ManifestMiddleware } from '../ManifestMiddleware';
import { ServerRequest } from '../server.types';

const asReq = (req: Partial<ServerRequest>) => req as ServerRequest;

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../../../../log');

jest.mock('../resolveAssets', () => ({
  resolveManifestAssets: jest.fn(),
  resolveGoogleServicesFile: jest.fn(),
}));

jest.mock('../resolveEntryPoint', () => ({
  resolveEntryPoint: jest.fn(() => './index.js'),
}));

jest.mock('@expo/config', () => ({
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

jest.mock('../../../project/ProjectDevices', () => ({
  saveDevicesAsync: jest.fn(async () => ({})),
}));

describe('_getBundleUrl', () => {
  const createConstructUrl = () =>
    jest.fn(({ scheme, hostname }) => `${scheme}://${hostname ?? 'localhost'}:8080`);
  it('returns the bundle url with the hostname', () => {
    const constructUrl = createConstructUrl();
    const middleware = new ManifestMiddleware('/', { constructUrl, mode: 'development' });
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
    const middleware = new ManifestMiddleware('/', {
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
});

describe('_resolveProjectSettingsAsync', () => {
  it(`returns the project settings for Metro dev servers`, async () => {
    asMock(getConfig).mockClear();
    const middleware = new ManifestMiddleware('/', {
      constructUrl: jest.fn(() => 'http://fake.mock'),
      mode: 'development',
    });
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
        logUrl: 'http://fake.mock/logs',
        mainModuleName: './index',
        packagerOpts: { dev: true },
      },
      hostUri: 'http://fake.mock',
    });

    // Limit this to a single call since it can get expensive.
    expect(getConfig).toHaveBeenCalledTimes(1);
  });
  it(`returns the project settings for Webpack dev servers`, async () => {
    asMock(getConfig).mockClear();
    const middleware = new ManifestMiddleware('/', {
      isNativeWebpack: true,
      constructUrl: jest.fn(() => 'http://fake.mock'),
      mode: 'production',
    });
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
        logUrl: 'http://fake.mock/logs',
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
    asMock(ProjectDevices.saveDevicesAsync).mockClear();
    const middleware = new ManifestMiddleware('/', {
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
    asMock(ProjectDevices.saveDevicesAsync).mockClear();
    asMock(Log.error).mockClear();
    const middleware = new ManifestMiddleware('/', {
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
    expect(res.statusCode).toEqual(520);

    expect(next).not.toBeCalled();
    // Returns error info.
    expect(res.end).toBeCalledWith(JSON.stringify({ error: 'Error: demo' }));
    // Ensure the user sees the error in the terminal.
    expect(Log.error).toBeCalled();
  });
});
