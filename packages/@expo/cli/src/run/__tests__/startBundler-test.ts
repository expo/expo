import { getConfig } from '@expo/config';

import { startBundlerAsync } from '../startBundler';

// Verify that `expo run:ios/android` selects the project's configured native
// bundler (Metro or Rollipop) rather than hard-coding Metro. Rollipop is a
// first-class run target through `RollipopBundlerDevServer`.
jest.mock('@expo/config', () => ({
  ...jest.requireActual('@expo/config'),
  getConfig: jest.fn(),
}));

jest.mock('../../start/server/DevServerManager', () => ({
  DevServerManager: {
    startMetroAsync: jest.fn(async (_root: string, _opts: unknown, bundler: string) => ({
      _bundler: bundler,
      getDefaultDevServer: () => ({ getDevServerUrl: () => 'http://localhost:8081' }),
      watchEnvironmentVariables: jest.fn(),
      bootstrapTypeScriptAsync: jest.fn(),
    })),
  },
}));

describe(startBundlerAsync, () => {
  const mockedGetConfig = jest.mocked(getConfig);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses the configured ios.bundler (rollipop) for expo run:ios', async () => {
    mockedGetConfig.mockReturnValue({
      // @ts-expect-error partial config
      exp: { ios: { bundler: 'rollipop' }, platforms: ['ios', 'android'] },
    });

    const manager = (await startBundlerAsync('/', {
      port: 8081,
      mode: 'development',
      platform: 'ios',
    })) as any;

    expect(manager._bundler).toBe('rollipop');
  });

  it('uses the configured android.bundler (rollipop) for expo run:android', async () => {
    mockedGetConfig.mockReturnValue({
      // @ts-expect-error partial config
      exp: { android: { bundler: 'rollipop' }, platforms: ['ios', 'android'] },
    });

    const manager = (await startBundlerAsync('/', {
      port: 8081,
      mode: 'development',
      platform: 'android',
    })) as any;

    expect(manager._bundler).toBe('rollipop');
  });

  it('honors an explicit bundler override over per-platform config', async () => {
    mockedGetConfig.mockReturnValue({
      // @ts-expect-error partial config
      exp: { ios: { bundler: 'metro' }, platforms: ['ios', 'android'] },
    });

    const manager = (await startBundlerAsync('/', {
      port: 8081,
      mode: 'development',
      platform: 'ios',
      bundler: 'rollipop',
    })) as any;

    expect(manager._bundler).toBe('rollipop');
  });

  it('defaults to metro when no rollipop config is present', async () => {
    mockedGetConfig.mockReturnValue({
      // @ts-expect-error partial config
      exp: { platforms: ['ios', 'android'] },
    });

    const manager = (await startBundlerAsync('/', {
      port: 8081,
      mode: 'development',
      platform: 'ios',
    })) as any;

    expect(manager._bundler).toBe('metro');
  });
});
