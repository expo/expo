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
      NODE_ENV: 'development',
      DOTENV_VALUE: 'from-parent',
      SHELL_VALUE: 'from-shell',
      __EXPO_ENV_LOADED: JSON.stringify(['DOTENV_VALUE']),
    };
    jest.mocked(silentResolveFrom).mockReturnValue('/app/node_modules/expo-updates/bin/cli.js');
    jest.mocked(spawnAsync).mockResolvedValue({ stdout: 'output' } as any);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('passes the selected mode without inherited dotenv values', async () => {
    await expect(
      expoUpdatesCommandAsync('/app', ['runtimeversion:resolve'], 'production')
    ).resolves.toBe('output');

    expect(process.env).toMatchObject({
      NODE_ENV: 'development',
      DOTENV_VALUE: 'from-parent',
      __EXPO_ENV_LOADED: JSON.stringify(['DOTENV_VALUE']),
    });
    expect(process.env.__EXPO_CONFIG_MODE).toBeUndefined();
    expect(spawnAsync).toHaveBeenCalledWith(
      '/app/node_modules/expo-updates/bin/cli.js',
      ['runtimeversion:resolve'],
      {
        stdio: 'pipe',
        env: expect.objectContaining({
          NODE_ENV: 'production',
          SHELL_VALUE: 'from-shell',
          __EXPO_CONFIG_MODE: 'production',
        }),
      }
    );

    const childEnv = jest.mocked(spawnAsync).mock.calls[0]?.[2]?.env;
    expect(childEnv?.DOTENV_VALUE).toBeUndefined();
    expect(childEnv?.__EXPO_ENV_LOADED).toBeUndefined();
  });
});
