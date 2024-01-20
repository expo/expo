import { vol } from 'memfs';

import { openBrowserAsync } from '../../../utils/open';
import { BundlerDevServer, BundlerStartOptions, DevServerInstance } from '../BundlerDevServer';
import { UrlCreator } from '../UrlCreator';
import { getPlatformBundlers } from '../platformBundlers';

jest.mock('../../../utils/open');
jest.mock(`../../../log`);
jest.mock('../AsyncNgrok');
jest.mock('../DevelopmentSession');
jest.mock('../../platforms/ios/ApplePlatformManager', () => {
  class ApplePlatformManager {
    openAsync = jest.fn(async () => ({ url: 'mock-apple-url' }));
  }
  return {
    ApplePlatformManager,
  };
});
jest.mock('../../platforms/android/AndroidPlatformManager', () => {
  class AndroidPlatformManager {
    openAsync = jest.fn(async () => ({ url: 'mock-android-url' }));
  }
  return {
    AndroidPlatformManager,
  };
});

const originalCwd = process.cwd();

beforeAll(() => {
  process.chdir('/');
});

const originalEnv = process.env;

beforeEach(() => {
  vol.reset();
  delete process.env.EXPO_NO_REDIRECT_PAGE;
});

afterAll(() => {
  process.chdir(originalCwd);
  process.env = originalEnv;
});

class MockBundlerDevServer extends BundlerDevServer {
  get name(): string {
    return 'fake';
  }

  protected async startImplementationAsync(
    options: BundlerStartOptions
  ): Promise<DevServerInstance> {
    const port = options.port || 3000;
    this.urlCreator = new UrlCreator(
      {
        scheme: options.https ? 'https' : 'http',
        ...options.location,
      },
      {
        port,
        getTunnelUrl: this.getTunnelUrl.bind(this),
      }
    );

    const protocol = 'http';
    const host = 'localhost';
    this.setInstance({
      // Server instance
      server: { close: jest.fn((fn) => fn?.()), addListener() {} },
      // URL Info
      location: {
        url: `${protocol}://${host}:${port}`,
        port,
        protocol,
        host,
      },
      middleware: {},
      // Match the native protocol.
      messageSocket: {
        broadcast: jest.fn(),
      },
    });
    await this.postStartAsync(options);

    return this.getInstance()!;
  }

  getPublicUrlCreator() {
    return this.urlCreator;
  }
  getNgrok() {
    return this.ngrok;
  }
  getDevSession() {
    return this.devSession;
  }

  protected getConfigModuleIds(): string[] {
    return ['./fake.config.js'];
  }

  public startTypeScriptServices(): Promise<void> {
    throw new Error('Unimplemented');
  }
}

class MockMetroBundlerDevServer extends MockBundlerDevServer {
  get name(): string {
    return 'metro';
  }
}

async function getRunningServer() {
  const devServer = new MockBundlerDevServer(
    '/',
    getPlatformBundlers('/', { web: { bundler: 'metro' } })
  );
  await devServer.startAsync({ location: {} });
  return devServer;
}

describe('broadcastMessage', () => {
  it(`sends a message`, async () => {
    const devServer = await getRunningServer();
    devServer.broadcastMessage('reload', { foo: true });
    expect(devServer.getInstance()!.messageSocket.broadcast).toBeCalledWith('reload', {
      foo: true,
    });
  });
});

describe('openPlatformAsync', () => {
  it(`opens a project in the browser using tunnel with metro web`, async () => {
    const devServer = new MockMetroBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } })
    );
    await devServer.startAsync({
      location: {
        hostType: 'tunnel',
      },
    });
    const { url } = await devServer.openPlatformAsync('desktop');
    expect(url).toBe('http://exp.tunnel.dev/foobar');
    expect(openBrowserAsync).toBeCalledWith('http://exp.tunnel.dev/foobar');
  });
  it(`opens a project in the browser`, async () => {
    const devServer = await getRunningServer();
    const { url } = await devServer.openPlatformAsync('desktop');
    expect(url).toBe('http://localhost:3000');
    expect(openBrowserAsync).toBeCalledWith('http://localhost:3000');
  });

  for (const platform of ['ios', 'android']) {
    for (const isDevClient of [false, true]) {
      const runtime = platform === 'ios' ? 'simulator' : 'emulator';
      it(`opens an ${platform} project in a ${runtime} (dev client: ${isDevClient})`, async () => {
        const devServer = await getRunningServer();
        devServer.isDevClient = isDevClient;
        const { url } = await devServer.openPlatformAsync(runtime);

        expect(
          (await devServer['getPlatformManagerAsync'](runtime)).openAsync
        ).toHaveBeenNthCalledWith(1, { runtime: isDevClient ? 'custom' : 'expo' }, {});

        expect(url).toBe(platform === 'ios' ? 'mock-apple-url' : 'mock-android-url');
      });
    }
  }
});

describe('stopAsync', () => {
  it(`stops a running dev server`, async () => {
    const server = new MockBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } })
    );
    const instance = await server.startAsync({
      location: {
        hostType: 'tunnel',
      },
    });
    const ngrok = server.getNgrok();
    const devSession = server.getNgrok();

    // Ensure services were started.
    expect(ngrok?.startAsync).toHaveBeenCalled();
    expect(devSession?.startAsync).toHaveBeenCalled();

    // Invoke the stop function
    await server.stopAsync();

    // Ensure services were stopped.
    expect(instance.server.close).toHaveBeenCalled();
    expect(ngrok?.stopAsync).toHaveBeenCalled();
    expect(devSession?.stopAsync).toHaveBeenCalled();
    expect(server.getInstance()).toBeNull();
  });
});

describe('isRedirectPageEnabled', () => {
  beforeEach(() => {
    vol.reset();
    delete process.env.EXPO_NO_REDIRECT_PAGE;
  });

  function mockDevClientInstalled() {
    vol.fromJSON(
      {
        'node_modules/expo-dev-client/package.json': '',
      },
      '/'
    );
  }

  it(`is redirect enabled`, async () => {
    mockDevClientInstalled();

    const server = new MockBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } }),
      {
        isDevClient: false,
      }
    );
    expect(server['isRedirectPageEnabled']()).toBe(true);
  });

  it(`redirect can be disabled with env var`, async () => {
    mockDevClientInstalled();

    process.env.EXPO_NO_REDIRECT_PAGE = '1';

    const server = new MockBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } }),
      {
        isDevClient: false,
      }
    );
    expect(server['isRedirectPageEnabled']()).toBe(false);
  });

  it(`redirect is disabled when running in dev client mode`, async () => {
    mockDevClientInstalled();

    const server = new MockBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } }),
      {
        isDevClient: true,
      }
    );
    expect(server['isRedirectPageEnabled']()).toBe(false);
  });

  it(`redirect is disabled when expo-dev-client is not installed in the project`, async () => {
    const server = new MockBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } }),
      {
        isDevClient: false,
      }
    );
    expect(server['isRedirectPageEnabled']()).toBe(false);
  });
});

describe('getRedirectUrl', () => {
  it(`returns null when the redirect page functionality is disabled`, async () => {
    const server = new MockBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } }),
      {
        isDevClient: false,
      }
    );
    server['isRedirectPageEnabled'] = () => false;
    expect(server['getRedirectUrl']()).toBe(null);
  });

  it(`gets the redirect page URL`, async () => {
    const server = new MockBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } })
    );
    server['isRedirectPageEnabled'] = () => true;
    await server.startAsync({
      location: {},
    });

    const urlCreator = server.getPublicUrlCreator()!;
    urlCreator.constructLoadingUrl = jest.fn(urlCreator.constructLoadingUrl);

    expect(server.getRedirectUrl('emulator')).toBe(
      'http://100.100.1.100:3000/_expo/loading?platform=android'
    );
    expect(server.getRedirectUrl('simulator')).toBe(
      'http://100.100.1.100:3000/_expo/loading?platform=ios'
    );
    expect(server.getRedirectUrl(null)).toBe('http://100.100.1.100:3000/_expo/loading');
    expect(urlCreator.constructLoadingUrl).toBeCalledTimes(3);
  });
});

describe('getExpoGoUrl', () => {
  it(`asserts if the dev server has not been started yet`, () => {
    const server = new MockBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } })
    );
    expect(() => server['getExpoGoUrl']()).toThrow('Dev server instance not found');
  });

  it(`gets the native Expo Go URL`, async () => {
    const server = new MockBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } })
    );
    await server.startAsync({
      location: {},
    });

    expect(await server['getExpoGoUrl']()).toBe('exp://100.100.1.100:3000');
  });
});

describe('getNativeRuntimeUrl', () => {
  it(`gets the native runtime URL`, async () => {
    const server = new MockBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } })
    );
    await server.startAsync({
      location: {},
    });
    expect(server.getNativeRuntimeUrl()).toBe('exp://100.100.1.100:3000');
    expect(server.getNativeRuntimeUrl({ hostname: 'localhost' })).toBe('exp://127.0.0.1:3000');
    expect(server.getNativeRuntimeUrl({ scheme: 'foobar' })).toBe('exp://100.100.1.100:3000');
  });
  it(`gets the native runtime URL for dev client`, async () => {
    const server = new MockBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } }),
      {
        isDevClient: true,
      }
    );
    await server.startAsync({
      location: {
        scheme: 'my-app',
      },
    });
    expect(server.getNativeRuntimeUrl()).toBe(
      'my-app://expo-development-client/?url=http%3A%2F%2F100.100.1.100%3A3000'
    );
    expect(server.getNativeRuntimeUrl({ hostname: 'localhost' })).toBe(
      'my-app://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A3000'
    );
    expect(server.getNativeRuntimeUrl({ scheme: 'foobar' })).toBe(
      'foobar://expo-development-client/?url=http%3A%2F%2F100.100.1.100%3A3000'
    );
  });
});

describe('getManifestMiddlewareAsync', () => {
  const server = new MockBundlerDevServer(
    '/',
    getPlatformBundlers('/', { web: { bundler: 'metro' } })
  );
  it(`asserts server is not running`, async () => {
    await expect(server['getManifestMiddlewareAsync']()).rejects.toThrow(
      /Dev server instance not found/
    );
  });
});

describe('_startTunnelAsync', () => {
  const server = new MockBundlerDevServer(
    '/',
    getPlatformBundlers('/', { web: { bundler: 'metro' } })
  );
  it(`returns null when the server isn't running`, async () => {
    expect(await server._startTunnelAsync()).toEqual(null);
  });
});

describe('getJsInspectorBaseUrl', () => {
  it('should return http based url', async () => {
    const devServer = new MockMetroBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } })
    );
    await devServer.startAsync({ location: {} });
    expect(devServer.getJsInspectorBaseUrl()).toBe('http://100.100.1.100:3000');
  });

  it('should return tunnel url', async () => {
    const devServer = new MockMetroBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } })
    );
    await devServer.startAsync({ location: { hostType: 'tunnel' } });
    expect(devServer.getJsInspectorBaseUrl()).toBe('http://exp.tunnel.dev');
  });

  it('should throw error for unsupported bundler', async () => {
    const devServer = new MockBundlerDevServer(
      '/',
      getPlatformBundlers('/', { web: { bundler: 'metro' } })
    );
    await devServer.startAsync({ location: {} });
    expect(() => devServer.getJsInspectorBaseUrl()).toThrow();
  });
});
