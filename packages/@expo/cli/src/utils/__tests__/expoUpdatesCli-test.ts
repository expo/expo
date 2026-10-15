import spawnAsync from '@expo/spawn-async';
import { silent as silentResolveFrom } from 'resolve-from';

import { expoUpdatesCommandAsync } from '../expoUpdatesCli';

jest.mock('@expo/spawn-async');
jest.mock('resolve-from');

describe(expoUpdatesCommandAsync, () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DOTENV_VALUE: 'from-parent',
      __EXPO_ENV_LOADED: JSON.stringify(['DOTENV_VALUE']),
    };
    jest.mocked(silentResolveFrom).mockReturnValue('/app/node_modules/expo-updates/bin/cli.js');
    jest.mocked(spawnAsync).mockResolvedValue({ stdout: 'output' } as any);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('runs the command in development mode without inherited dotenv values', async () => {
    await expect(expoUpdatesCommandAsync('/app', ['runtimeversion:resolve'])).resolves.toBe(
      'output'
    );

    const childEnv = jest.mocked(spawnAsync).mock.calls[0]?.[2]?.env;
    expect(childEnv?.__EXPO_CONFIG_MODE).toBe('development');
    expect(childEnv?.DOTENV_VALUE).toBeUndefined();
  });
});
