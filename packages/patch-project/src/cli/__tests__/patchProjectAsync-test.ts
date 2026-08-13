import { loadProjectEnv, logLoadedEnv } from '@expo/env';
import { getConfig } from 'expo/config';

import { patchProjectAsync } from '../patchProjectAsync';

jest.mock('@expo/env', () => ({
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
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, EXPO_CONFIG_MODE: 'production' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('loads and logs development env before Expo config', async () => {
    const envInfo = { result: 'skipped' as const, loaded: [] };
    jest.mocked(loadProjectEnv).mockReturnValue(envInfo);
    let configMode: string | undefined = 'not loaded';
    jest.mocked(getConfig).mockImplementation(() => {
      configMode = process.env.EXPO_CONFIG_MODE;
      return { exp: {} } as ReturnType<typeof getConfig>;
    });

    await patchProjectAsync('/app', { platforms: [] });

    expect(loadProjectEnv).toHaveBeenCalledWith('/app', { mode: 'development' });
    expect(logLoadedEnv).toHaveBeenCalledWith(envInfo);
    expect(jest.mocked(loadProjectEnv).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(getConfig).mock.invocationCallOrder[0]!
    );
    expect(configMode).toBeUndefined();
  });
});
