import { updateEventLoggerMetadata } from '2g';
import { getConfig } from '@expo/config';

import type { BundlerStartOptions } from '../BundlerDevServer';
import { DevServerManager } from '../DevServerManager';
import { MetroBundlerDevServer } from '../metro/MetroBundlerDevServer';
import { getPlatformBundlers } from '../platformBundlers';
import { WebpackBundlerDevServer } from '../webpack/WebpackBundlerDevServer';

jest.mock('2g', () => ({
  ...jest.requireActual('2g'),
  updateEventLoggerMetadata: jest.fn(),
}));
jest.mock('../../../utils/FileNotifier');
jest.mock('../../resolveOptions', () => ({ resolveSchemeAsync: jest.fn(async () => 'my-app') }));
jest.mock('../metro/MetroBundlerDevServer', () => ({ MetroBundlerDevServer: jest.fn() }));
jest.mock('../webpack/WebpackBundlerDevServer', () => ({ WebpackBundlerDevServer: jest.fn() }));
jest.mock('@expo/config');
jest.mock('../platformBundlers');
jest.mock('../DevToolsPluginManager');

const asMock = <T extends (...args: any[]) => any>(fn: T) => fn as jest.MockedFunction<T>;

function createManager(webPort?: number, port?: number) {
  // `isExporting` skips the babel config watcher, which needs a real project on disk.
  const options = { location: {}, isExporting: true, port } as BundlerStartOptions;
  const manager = new DevServerManager('/', options, webPort);
  jest.spyOn(manager, 'startAsync').mockResolvedValue({} as any);
  return manager;
}

beforeEach(() => {
  asMock(getConfig).mockReturnValue({ exp: {} } as any);
  asMock(getPlatformBundlers).mockReturnValue({ web: 'webpack' } as any);
});

describe('ensureWebDevServerRunningAsync', () => {
  it(`starts the web dev server with the port resolved up front`, async () => {
    const manager = createManager(19006);

    await manager.ensureWebDevServerRunningAsync();

    expect(manager.startAsync).toHaveBeenCalledWith([
      { type: 'webpack', options: expect.objectContaining({ port: 19006 }) },
    ]);
  });

  it(`falls back to the start options port when no web port was resolved`, async () => {
    // `expo run:*` builds the manager through `startMetroAsync`, which has no web port.
    const manager = createManager(undefined, 8081);

    await manager.ensureWebDevServerRunningAsync();

    expect(manager.startAsync).toHaveBeenCalledWith([
      { type: 'webpack', options: expect.objectContaining({ port: 8081 }) },
    ]);
  });
});

function mockServer(native: boolean, port: number) {
  return {
    isDevClient: false,
    startAsync: jest.fn(async () => {}),
    stopAsync: jest.fn(async () => {}),
    isTargetingNative: () => native,
    isTargetingWeb: () => !native,
    getInstance: () => ({ location: { port } }),
    getDevServerUrl: () => `http://localhost:${port}`,
    getNativeRuntimeUrl() {
      return this.isDevClient
        ? 'my-app://?__expo_url=http%3A%2F%2Flocalhost'
        : `exp://localhost:${port}`;
    },
    getUrlCreator: () => ({ defaults: {} }),
  };
}

describe('session metadata', () => {
  const options: BundlerStartOptions = { location: {} };

  it('publishes the actual port only after startup, and clears endpoints on shutdown', async () => {
    const server = mockServer(true, 8082);
    server.startAsync.mockImplementation(async () => {
      expect(updateEventLoggerMetadata).toHaveBeenLastCalledWith({
        ready: false,
        devServerUrl: null,
        port: null,
        runtimeUrl: null,
      });
    });
    jest.mocked(MetroBundlerDevServer).mockImplementation(() => server as any);
    const manager = new DevServerManager('/', options);
    await manager.startAsync([{ type: 'metro', options: { ...options, port: 8081 } }]);
    expect(updateEventLoggerMetadata).toHaveBeenLastCalledWith({
      ready: true,
      port: 8082,
      devServerUrl: 'http://localhost:8082',
      runtimeUrl: 'exp://localhost:8082',
    });
    await manager.stopAsync();
    expect(updateEventLoggerMetadata).toHaveBeenLastCalledWith({
      ready: false,
      port: null,
      devServerUrl: null,
      runtimeUrl: null,
    });
  });

  it('keeps the native endpoint when web starts and refreshes the runtime URL', async () => {
    jest.mocked(MetroBundlerDevServer).mockImplementation(() => mockServer(true, 8081) as any);
    jest.mocked(WebpackBundlerDevServer).mockImplementation(() => mockServer(false, 19006) as any);
    const manager = new DevServerManager('/', options);
    await manager.startAsync([{ type: 'metro' }]);
    await manager.ensureWebDevServerRunningAsync();
    expect(updateEventLoggerMetadata).toHaveBeenLastCalledWith(
      expect.objectContaining({ port: 8081 })
    );
    await manager.toggleRuntimeMode(true);
    expect(updateEventLoggerMetadata).toHaveBeenLastCalledWith(
      expect.objectContaining({
        port: 8081,
        runtimeUrl: 'my-app://?__expo_url=http%3A%2F%2Flocalhost',
      })
    );
  });

  it('publishes a web-only endpoint without a native launch URL', async () => {
    jest.mocked(WebpackBundlerDevServer).mockImplementation(() => mockServer(false, 19006) as any);
    const manager = new DevServerManager('/', options);
    await manager.startAsync([{ type: 'webpack' }]);
    expect(updateEventLoggerMetadata).toHaveBeenLastCalledWith({
      ready: true,
      port: 19006,
      devServerUrl: 'http://localhost:19006',
      runtimeUrl: null,
    });
  });

  it('does not claim readiness when startup fails', async () => {
    const server = mockServer(true, 8081);
    server.startAsync.mockRejectedValue(new Error('startup failed'));
    jest.mocked(MetroBundlerDevServer).mockImplementation(() => server as any);
    const manager = new DevServerManager('/', options);
    await expect(manager.startAsync([{ type: 'metro' }])).rejects.toThrow('startup failed');
    expect(updateEventLoggerMetadata).toHaveBeenCalledTimes(1);
    expect(updateEventLoggerMetadata).toHaveBeenCalledWith({
      ready: false,
      devServerUrl: null,
      port: null,
      runtimeUrl: null,
    });
  });

  it.each([{ isExporting: true }, { headless: true }])('excludes %j servers', async (flags) => {
    jest.mocked(MetroBundlerDevServer).mockImplementation(() => mockServer(true, 8081) as any);
    const manager = new DevServerManager('/', { ...options, ...flags });
    await manager.startAsync([{ type: 'metro' }]);
    await manager.stopAsync();
    expect(updateEventLoggerMetadata).not.toHaveBeenCalled();
  });
});
