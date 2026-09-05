import { loadProjectEnv } from '@expo/env';
import { getConfig } from 'expo/config';

import { syncConfigurationToNativeAsync } from '../syncConfigurationToNativeAsync';

jest.mock('@expo/env');
jest.mock('expo/config');

describe(syncConfigurationToNativeAsync, () => {
  it('loads env files before reading app config', async () => {
    jest.mocked(getConfig).mockImplementation(() => {
      expect(loadProjectEnv).toHaveBeenCalledWith('/app', { mode: 'production' });
      throw new Error('stop after reading app config');
    });

    await expect(
      syncConfigurationToNativeAsync({
        projectRoot: '/app',
        platform: 'android',
        workflow: 'generic',
        mode: 'production',
      })
    ).rejects.toThrow('stop after reading app config');
  });
});
