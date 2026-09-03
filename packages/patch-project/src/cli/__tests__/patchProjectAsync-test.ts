import { loadProjectEnv, logLoadedEnv } from '@expo/env';
import { getConfig } from 'expo/config';

import { patchProjectAsync } from '../patchProjectAsync';

jest.mock('@expo/env', () => ({
  ...jest.requireActual('@expo/env'),
  loadProjectEnv: jest.fn(),
  logLoadedEnv: jest.fn(),
}));
jest.mock('expo/config', () => ({
  getConfig: jest.fn(),
}));
jest.mock('../resolveFromExpoCli', () => ({
  resolveFromExpoCli: jest.fn(() => 'patch-project-resolve-options'),
}));
jest.mock(
  'patch-project-resolve-options',
  () => ({
    ensureValidPlatforms: jest.fn(() => []),
  }),
  { virtual: true }
);

describe(patchProjectAsync, () => {
  const devGlobal = globalThis as typeof globalThis & { __DEV__?: boolean };
  const originalDev = devGlobal.__DEV__;
  const originalConfigMode = process.env.__EXPO_CONFIG_MODE;

  beforeEach(() => {
    process.env.__EXPO_CONFIG_MODE = 'production';
  });

  afterEach(() => {
    devGlobal.__DEV__ = originalDev;
    if (originalConfigMode === undefined) {
      delete process.env.__EXPO_CONFIG_MODE;
    } else {
      process.env.__EXPO_CONFIG_MODE = originalConfigMode;
    }
  });

  it('loads and logs development env before Expo config', async () => {
    const envInfo = { result: 'skipped' as const, loaded: [] };
    jest.mocked(loadProjectEnv).mockReturnValue(envInfo);
    jest.mocked(getConfig).mockReturnValue({ exp: {} } as ReturnType<typeof getConfig>);

    await patchProjectAsync('/app', { platforms: [] });

    expect(loadProjectEnv).toHaveBeenCalledWith('/app', { mode: 'development' });
    expect(logLoadedEnv).toHaveBeenCalledWith(envInfo);
    expect(jest.mocked(loadProjectEnv).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(getConfig).mock.invocationCallOrder[0]!
    );
    expect(devGlobal.__DEV__).toBe(true);
    expect(process.env.__EXPO_CONFIG_MODE).toBeUndefined();
  });
});
