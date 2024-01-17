import { vol } from 'memfs';
import webpack from 'webpack';

import { BundlerStartOptions } from '../../BundlerDevServer';
import { getPlatformBundlers } from '../../platformBundlers';
import { WebpackBundlerDevServer } from '../WebpackBundlerDevServer';

jest.mock('../../../../log');
jest.mock('../resolveFromProject');

jest.mock('../compile', () => ({
  compileAsync: jest.fn(),
}));

const originalCwd = process.cwd();

beforeEach(() => {
  process.chdir('/');
  vol.reset();
});
afterAll(() => {
  process.chdir(originalCwd);
});

async function getStartedDevServer(options: Partial<BundlerStartOptions> = {}) {
  const devServer = new WebpackBundlerDevServer(
    '/',
    getPlatformBundlers('/', { web: { bundler: 'webpack' } })
  );
  devServer['getAvailablePortAsync'] = jest.fn(() => Promise.resolve(3000));
  // Tested in the superclass
  devServer['postStartAsync'] = jest.fn(async () => {});
  await devServer.startAsync({ location: {}, ...options });
  return devServer;
}

describe('bundleAsync', () => {
  it(`bundles in dev mode`, async () => {
    const devServer = new WebpackBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'webpack' } })
    );

    devServer['clearWebProjectCacheAsync'] = jest.fn();
    devServer['loadConfigAsync'] = jest.fn(async () => ({}));

    await devServer.bundleAsync({ mode: 'development', clear: true });
    expect(devServer['clearWebProjectCacheAsync']).toBeCalled();
    expect(devServer['loadConfigAsync']).toHaveBeenCalledWith({
      isImageEditingEnabled: true,
      mode: 'development',
    });
  });
});

describe('startAsync', () => {
  it(`starts webpack`, async () => {
    const devServer = await getStartedDevServer();

    expect(devServer['getAvailablePortAsync']).toHaveBeenCalled();
    expect(devServer['postStartAsync']).toHaveBeenCalled();

    expect(devServer.getInstance()).toEqual({
      location: {
        host: '100.100.1.100',
        port: 3000,
        protocol: 'http',
        url: 'http://100.100.1.100:3000',
      },
      messageSocket: {
        broadcast: expect.any(Function),
      },
      middleware: null,
      server: {
        close: expect.any(Function),
        listen: expect.any(Function),
        sendMessage: expect.any(Function),
      },
    });

    expect(webpack).toHaveBeenCalled();
  });
  it(`clears the webpack cache`, async () => {
    vol.fromJSON({ '.expo/web/cache/development/file': '...' }, '/');

    await getStartedDevServer({
      resetDevServer: true,
    });

    // Cache is cleared...
    expect(vol.toJSON()['/.expo/web/cache']).toBe(null);
  });
});

describe('getProjectConfigFilePath', () => {
  it(`loads from project`, async () => {
    vol.fromJSON({ 'webpack.config.js': '{}' }, '/');
    const devServer = new WebpackBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'webpack' } })
    );
    expect(devServer.getProjectConfigFilePath()).toBe('/webpack.config.js');
  });
  it(`cannot load from project`, async () => {
    vol.fromJSON({ 'package.json': '{}' }, '/');
    const devServer = new WebpackBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'webpack' } })
    );
    expect(devServer.getProjectConfigFilePath()).toBe(null);
  });
});

describe('broadcastMessage', () => {
  it(`converts reload messages`, async () => {
    const devServer = await getStartedDevServer();
    devServer.broadcastMessage('reload', { foo: true });

    expect(
      // @ts-expect-error
      devServer.getInstance().server.sendMessage
    ).toBeCalledWith(undefined, 'content-changed', { foo: true });
  });
});
