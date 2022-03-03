import { vol } from 'memfs';
import webpack from 'webpack';

import { BundlerStartOptions } from '../../BundlerDevServer';
import { WebpackBundlerDevServer } from '../WebpackBundlerDevServer';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../../../../log');

const originalCwd = process.cwd();

beforeEach(() => {
  process.chdir('/');
  vol.reset();
});
afterAll(() => {
  process.chdir(originalCwd);
});

async function getStartedDevServer(options: Partial<BundlerStartOptions> = {}) {
  const devServer = new WebpackBundlerDevServer('/', false);
  devServer['getAvailablePortAsync'] = jest.fn(() => Promise.resolve(3000));
  // Tested in the superclass
  devServer['postStartAsync'] = jest.fn(async () => {});
  await devServer.startAsync({ location: {}, ...options });
  return devServer;
}

describe('startAsync', () => {
  it(`starts webpack`, async () => {
    asMock(webpack).mockClear();

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
      middleware: undefined,
      server: {
        close: expect.any(Function),
        listen: expect.any(Function),
        sockWrite: expect.any(Function),
      },
    });

    expect(webpack).toHaveBeenCalled();
  });
  it(`clears the webpack cache`, async () => {
    asMock(webpack).mockClear();

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
    const devServer = new WebpackBundlerDevServer('/');
    expect(devServer.getProjectConfigFilePath()).toBe('webpack.config.js');
  });
  it(`cannot load from project`, async () => {
    vol.fromJSON({ 'package.json': '{}' }, '/');
    const devServer = new WebpackBundlerDevServer('/');
    expect(devServer.getProjectConfigFilePath()).toBe(null);
  });
});

describe('broadcastMessage', () => {
  it(`converts reload messages`, async () => {
    const devServer = await getStartedDevServer();
    devServer.broadcastMessage('reload', { foo: true });

    expect(
      // @ts-expect-error
      devServer.getInstance().server.sockWrite
    ).toBeCalledWith(undefined, 'content-changed', { foo: true });
  });
  it(`uses custom handler`, async () => {
    const devServer = await getStartedDevServer();
    devServer['customMessageSocketBroadcaster'] = jest.fn();
    devServer.broadcastMessage('reload', { foo: true });

    expect(
      // @ts-expect-error
      devServer.getInstance().server.sockWrite
    ).not.toBeCalled();

    expect(devServer['customMessageSocketBroadcaster']).toBeCalledWith('reload', { foo: true });
  });
});
