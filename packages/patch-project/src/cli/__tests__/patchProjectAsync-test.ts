import { loadProjectEnv, logLoadedEnv } from '@expo/env';
import { getConfig } from 'expo/config';
import { vol } from 'memfs';

import { diffAsync } from '../../gitPatch';
import { getPatchFilesAsync } from '../../patchFiles';
import { moveAsync } from '../dir';
import { generateNativeProjectsAsync } from '../generateNativeProjects';
import * as logger from '../logger';
import { revertNormalizeNativeProjectsAsync } from '../normalizeNativeProjects';
import { patchProjectAsync } from '../patchProjectAsync';

jest.mock('fs');
jest.mock('fs/promises');
jest.mock('../../patchFiles', () => ({
  getPatchFilesAsync: jest.fn(async () => []),
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
  platformSanityCheckAsync: jest.fn(),
}));
jest.mock('../dir', () => {
  const actualDir = jest.requireActual('../dir');
  return { ...actualDir, moveAsync: jest.fn(actualDir.moveAsync) };
});
jest.mock('../normalizeNativeProjects', () => {
  const actual = jest.requireActual('../normalizeNativeProjects');
  const fs = require('fs/promises');
  const path = require('path');
  return {
    ...actual,
    // The real iOS normalization needs a real Xcode project. This fake keeps its backup contract.
    normalizeNativeProjectsAsync: jest.fn(
      async ({ projectRoot, platform, workingDirectories, backup }) => {
        if (platform !== 'ios') {
          return {};
        }
        const pbxprojPath = path.join(projectRoot, 'ios/app.xcodeproj/project.pbxproj');
        const backupFileMappings: Record<string, string> = {};
        if (backup) {
          const backupPath = path.join(workingDirectories.tmpDir, 'project.pbxproj');
          await fs.copyFile(pbxprojPath, backupPath);
          backupFileMappings[pbxprojPath] = backupPath;
        }
        await fs.writeFile(pbxprojPath, 'normalized pbxproj');
        return backupFileMappings;
      }
    ),
    revertNormalizeNativeProjectsAsync: jest.fn(actual.revertNormalizeNativeProjectsAsync),
  };
});
jest.mock('../logger', () => ({
  log: jest.fn(),
  error: jest.fn(),
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
        '/app/ios/app.xcodeproj/project.pbxproj': 'original pbxproj',
        '/app/ios/app/AppDelegate.swift': 'original AppDelegate',
      });
      jest.mocked(loadProjectEnv).mockReturnValue({ result: 'skipped', loaded: [] });
      jest.mocked(getConfig).mockReturnValue({
        exp: {
          name: 'app',
          slug: 'app',
          android: { package: 'com.example.app' },
          ios: { bundleIdentifier: 'com.example.app' },
        },
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

    function mockGeneratedIosProject() {
      jest.mocked(generateNativeProjectsAsync).mockImplementationOnce(async () => {
        vol.fromJSON({ '/app/ios/app.xcodeproj/project.pbxproj': 'generated pbxproj' });
        return 'checksum';
      });
    }

    it('restores the native project when generating the template project fails', async () => {
      jest.mocked(generateNativeProjectsAsync).mockImplementationOnce(async () => {
        vol.fromJSON({ '/app/android/build.gradle': 'partially generated' });
        throw new Error('Failed to download the prebuild template');
      });

      await expect(patchProjectAsync('/app', { platforms: ['android'] })).rejects.toThrow(
        'Failed to download the prebuild template'
      );

      expectOriginalNativeProjectRestored();
      expect(logger.log).toHaveBeenCalledWith(
        'Restored the original android project to /app/android. Do not delete the android or ios directory.'
      );
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

    it('keeps the original native project and rethrows the original error when restoring fails', async () => {
      const { moveAsync: actualMoveAsync } = jest.requireActual<typeof import('../dir')>('../dir');
      jest.mocked(generateNativeProjectsAsync).mockImplementationOnce(async () => {
        vol.fromJSON({ '/app/android/build.gradle': 'generated build.gradle' });
        return 'checksum';
      });
      jest.mocked(diffAsync).mockRejectedValueOnce(new Error('git diff failed'));
      jest
        .mocked(moveAsync)
        .mockImplementationOnce(actualMoveAsync)
        .mockImplementationOnce(actualMoveAsync)
        .mockRejectedValueOnce(new Error('restore failed'));

      await expect(patchProjectAsync('/app', { platforms: ['android'] })).rejects.toThrow(
        'git diff failed'
      );

      expect(vol.toJSON('/app/.patch-project-tmp/android/diff/android')).toEqual({
        '/app/.patch-project-tmp/android/diff/android/build.gradle': 'original build.gradle',
        '/app/.patch-project-tmp/android/diff/android/app/src/main/AndroidManifest.xml':
          'original manifest',
      });
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'The original project is in /app/.patch-project-tmp/android/diff/android.'
        )
      );
    });

    it('restores the old patch files when generating the patch fails', async () => {
      vol.fromJSON({ '/app/cng-patches/android+old.patch': 'old patch' });
      jest.mocked(getPatchFilesAsync).mockResolvedValueOnce(['android+old.patch']);
      jest.mocked(generateNativeProjectsAsync).mockImplementationOnce(async () => {
        vol.fromJSON({ '/app/android/build.gradle': 'generated build.gradle' });
        return 'checksum';
      });
      jest.mocked(diffAsync).mockImplementationOnce(async (_diffDir, patchFilePath) => {
        vol.writeFileSync(patchFilePath, '');
        throw new Error('git diff failed');
      });

      await expect(patchProjectAsync('/app', { platforms: ['android'] })).rejects.toThrow(
        'git diff failed'
      );

      expect(vol.toJSON('/app/cng-patches')).toEqual({
        '/app/cng-patches/android+old.patch': 'old patch',
      });
      expectOriginalNativeProjectRestored();
      expect(logger.log).toHaveBeenCalledWith(
        'Restored the original android project to /app/android and the old patch files. Do not delete the android or ios directory, or those patch files.'
      );
    });

    it('removes the old patch files after a successful patch', async () => {
      vol.fromJSON({ '/app/cng-patches/android+old.patch': 'old patch' });
      jest.mocked(getPatchFilesAsync).mockResolvedValueOnce(['android+old.patch']);
      jest.mocked(generateNativeProjectsAsync).mockImplementationOnce(async () => {
        vol.fromJSON({ '/app/android/build.gradle': 'generated build.gradle' });
        return 'checksum';
      });
      jest.mocked(diffAsync).mockImplementationOnce(async (_diffDir, patchFilePath) => {
        vol.writeFileSync(patchFilePath, 'patch');
      });

      await patchProjectAsync('/app', { platforms: ['android'] });

      expect(vol.readFileSync('/app/cng-patches/android+checksum.patch', 'utf8')).toBe('patch');
      expect(vol.existsSync('/app/cng-patches/android+old.patch')).toBe(false);
      expect(logger.log).toHaveBeenCalledWith(
        'Removed the old patch file: /app/cng-patches/android+old.patch'
      );
      expectOriginalNativeProjectRestored();
    });

    it('restores the original ios project.pbxproj when generating the patch fails', async () => {
      mockGeneratedIosProject();
      jest.mocked(diffAsync).mockRejectedValueOnce(new Error('git diff failed'));

      await expect(patchProjectAsync('/app', { platforms: ['ios'] })).rejects.toThrow(
        'git diff failed'
      );

      expect(vol.toJSON('/app/ios')).toEqual({
        '/app/ios/app.xcodeproj/project.pbxproj': 'original pbxproj',
        '/app/ios/app/AppDelegate.swift': 'original AppDelegate',
      });
      expect(vol.existsSync('/app/.patch-project-tmp/ios')).toBe(false);
    });

    it('keeps the project.pbxproj backup when reverting it fails after a failed patch', async () => {
      mockGeneratedIosProject();
      jest.mocked(diffAsync).mockRejectedValueOnce(new Error('git diff failed'));
      jest
        .mocked(revertNormalizeNativeProjectsAsync)
        .mockRejectedValueOnce(new Error('revert failed'));

      await expect(patchProjectAsync('/app', { platforms: ['ios'] })).rejects.toThrow(
        'git diff failed'
      );

      expect(vol.readFileSync('/app/ios/app/AppDelegate.swift', 'utf8')).toBe(
        'original AppDelegate'
      );
      expect(vol.readFileSync('/app/.patch-project-tmp/ios/tmp/project.pbxproj', 'utf8')).toBe(
        'original pbxproj'
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'The original native project is back in /app/ios, but patch-project could not restore some files that it changed.'
        )
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          '/app/.patch-project-tmp/ios/tmp/project.pbxproj -> /app/ios/app.xcodeproj/project.pbxproj'
        )
      );
    });

    it('keeps the project.pbxproj backup when reverting it fails after a successful patch', async () => {
      mockGeneratedIosProject();
      jest.mocked(diffAsync).mockImplementationOnce(async (_diffDir, patchFilePath) => {
        vol.writeFileSync(patchFilePath, 'patch');
      });
      jest
        .mocked(revertNormalizeNativeProjectsAsync)
        .mockRejectedValueOnce(new Error('revert failed'));

      await expect(patchProjectAsync('/app', { platforms: ['ios'] })).rejects.toThrow(
        'patch-project created the patch, and the original native project is back in /app/ios. Copy each backup over its file, as the message above says, before you run patch-project again.'
      );

      expect(vol.readFileSync('/app/ios/app/AppDelegate.swift', 'utf8')).toBe(
        'original AppDelegate'
      );
      expect(vol.readFileSync('/app/.patch-project-tmp/ios/tmp/project.pbxproj', 'utf8')).toBe(
        'original pbxproj'
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('The original native project is back in /app/ios')
      );
    });
  });
});
