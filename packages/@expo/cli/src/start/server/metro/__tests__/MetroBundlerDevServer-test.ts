import { getConfig } from '@expo/config';
import { vol } from 'memfs';

import { BundlerStartOptions } from '../../BundlerDevServer';
import { getPlatformBundlers } from '../../platformBundlers';
import { MetroBundlerDevServer } from '../MetroBundlerDevServer';
import { instantiateMetroAsync } from '../instantiateMetro';
import { warnInvalidWebOutput } from '../router';
import { FileChangeEvent, observeAnyFileChanges } from '../waitForMetroToObserveTypeScriptFile';

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
    let pCallback: ((events: FileChangeEvent[]) => void | Promise<void>) | null = null;
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
    callback([
      {
        filePath: '/app/foo+api.ts',
        type: 'change',
        metadata: { type: 'f' },
      },
    ]);
    expect(warnInvalidWebOutput).toBeCalled();
  });

  it(`does not warn about invalid output when API route is being deleted`, async () => {
    mockMetroStatic();
    const callback = await setupDevServer();
    callback([
      {
        filePath: '/app/foo+api.ts',
        type: 'change',
        metadata: { type: 'd' },
      },
    ]);
    expect(warnInvalidWebOutput).not.toBeCalled();

    // Sanity to ensure test works.
    callback([
      {
        filePath: '/app/foo+api.ts',
        type: 'change',
        metadata: { type: 'l' },
      },
    ]);
    expect(warnInvalidWebOutput).toBeCalled();
  });

  it(`does not warn about invalid output when file is not a valid API route`, async () => {
    mockMetroStatic();
    const callback = await setupDevServer();
    callback([
      {
        filePath: '/app/foo.ts',
        type: 'change',
        metadata: { type: 'l' },
      },
    ]);
    expect(warnInvalidWebOutput).not.toBeCalled();
  });

  it(`does not warn about invalid output when file is outside of routes directory`, async () => {
    mockMetroStatic();
    const callback = await setupDevServer();
    callback([
      {
        filePath: '/other/foo+api.js',
        type: 'change',
        metadata: { type: 'l' },
      },
    ]);
    expect(warnInvalidWebOutput).not.toBeCalled();
  });
});
