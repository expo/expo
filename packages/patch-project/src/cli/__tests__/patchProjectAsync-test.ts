import { loadProjectEnv, logLoadedEnv } from '@expo/env';
import { getConfig } from 'expo/config';
import { vol } from 'memfs';

import { diffAsync } from '../../gitPatch';
import { generateNativeProjectsAsync } from '../generateNativeProjects';
import { patchProjectAsync } from '../patchProjectAsync';

jest.mock('fs');
jest.mock('fs/promises');
jest.mock('glob', () => ({
  glob: jest.fn(async () => []),
}));
jest.mock('../../gitPatch', () => ({
  initializeGitRepoAsync: jest.fn(),
  addAllToGitIndexAsync: jest.fn(),
  commitAsync: jest.fn(),
  diffAsync: jest.fn(),
}));
jest.mock('../generateNativeProjects', () => ({
  ...jest.requireActual('../generateNativeProjects'),
  generateNativeProjectsAsync: jest.fn(),
}));
jest.mock('../logger', () => ({
  log: jest.fn(),
}));

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

  describe('native project directory', () => {
    beforeEach(() => {
      vol.reset();
      vol.fromJSON({
        '/app/android/build.gradle': 'original build.gradle',
        '/app/android/app/src/main/AndroidManifest.xml': 'original manifest',
      });
      jest.mocked(loadProjectEnv).mockReturnValue({ result: 'skipped', loaded: [] });
      jest.mocked(getConfig).mockReturnValue({
        exp: { name: 'app', slug: 'app', android: { package: 'com.example.app' } },
      } as ReturnType<typeof getConfig>);
      const { ensureValidPlatforms } = jest.requireMock('patch-project-resolve-options');
      jest.mocked(ensureValidPlatforms).mockImplementationOnce((platforms: string[]) => platforms);
    });

    function expectOriginalNativeProjectRestored() {
      expect(vol.toJSON('/app/android')).toEqual({
        '/app/android/build.gradle': 'original build.gradle',
        '/app/android/app/src/main/AndroidManifest.xml': 'original manifest',
      });
      expect(vol.existsSync('/app/.patch-project-tmp/android')).toBe(false);
    }

    it('moves the native project back after saving the patch', async () => {
      jest.mocked(generateNativeProjectsAsync).mockImplementationOnce(async () => {
        vol.fromJSON({ '/app/android/build.gradle': 'generated build.gradle' });
        return 'checksum';
      });
      jest.mocked(diffAsync).mockImplementationOnce(async (_repoRoot, patchFilePath) => {
        vol.writeFileSync(patchFilePath, 'patch contents');
      });

      await patchProjectAsync('/app', { platforms: ['android'] });

      expectOriginalNativeProjectRestored();
      expect(vol.readFileSync('/app/cng-patches/android+checksum.patch', 'utf8')).toBe(
        'patch contents'
      );
    });

    it('restores the native project when generating the template project fails', async () => {
      jest.mocked(generateNativeProjectsAsync).mockImplementationOnce(async () => {
        vol.fromJSON({ '/app/android/build.gradle': 'partially generated' });
        throw new Error('Failed to download the prebuild template');
      });

      await expect(patchProjectAsync('/app', { platforms: ['android'] })).rejects.toThrow(
        'Failed to download the prebuild template'
      );

      expectOriginalNativeProjectRestored();
    });

    it('restores the native project when generating the patch fails', async () => {
      jest.mocked(generateNativeProjectsAsync).mockImplementationOnce(async () => {
        vol.fromJSON({ '/app/android/build.gradle': 'generated build.gradle' });
        return 'checksum';
      });
      jest.mocked(diffAsync).mockRejectedValueOnce(new Error('git diff failed'));

      await expect(patchProjectAsync('/app', { platforms: ['android'] })).rejects.toThrow(
        'git diff failed'
      );

      expectOriginalNativeProjectRestored();
    });
  });
});
