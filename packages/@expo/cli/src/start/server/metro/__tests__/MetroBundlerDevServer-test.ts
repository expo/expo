import { vol } from 'memfs';

import { logEventAsync } from '../../../../utils/analytics/rudderstackClient';
import { BundlerStartOptions } from '../../BundlerDevServer';
import { getPlatformBundlers } from '../../platformBundlers';
import { MetroBundlerDevServer, getDeepLinkHandler } from '../MetroBundlerDevServer';
import { instantiateMetroAsync } from '../instantiateMetro';

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
    middleware: { use: jest.fn() },
    server: { listen: jest.fn(), close: jest.fn() },
  })),
}));
jest.mock('../../../../log');
jest.mock('../../../../utils/analytics/getDevClientProperties', () => jest.fn(() => ({})));
jest.mock('../../../../utils/analytics/rudderstackClient');

beforeEach(() => {
  vol.reset();
});

async function getStartedDevServer(options: Partial<BundlerStartOptions> = {}) {
  const devServer = new MetroBundlerDevServer('/', getPlatformBundlers({}), false);
  devServer['getAvailablePortAsync'] = jest.fn(() => Promise.resolve(3000));
  // Tested in the superclass
  devServer['postStartAsync'] = jest.fn(async () => {});
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

describe('onDeepLink', () => {
  it(`logs an event if runtime is custom`, async () => {
    const handler = getDeepLinkHandler('/');
    await handler({ runtime: 'custom', platform: 'ios' });
    expect(logEventAsync).toHaveBeenCalledWith('dev client start command', {
      status: 'started',
    });
  });

  it(`does not log an event if runtime is expo`, async () => {
    const handler = getDeepLinkHandler('/');
    await handler({ runtime: 'expo', platform: 'ios' });
    expect(logEventAsync).not.toHaveBeenCalled();
  });
});
