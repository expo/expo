import spawnAsync from '@expo/spawn-async';

import { applyPatchAsync, getPatchChangedLinesAsync, isPatchAppliedAsync } from '../gitPatch';

jest.mock('@expo/spawn-async');
jest.mock('fs');
const mockedSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;

beforeEach(() => {
  mockedSpawnAsync.mockReset();
});

describe(applyPatchAsync, () => {
  it('should throw if git is not installed', async () => {
    const error = new Error('spawn git ENOENT');
    // @ts-expect-error: Simulate spawn error
    error.code = 'ENOENT';
    mockedSpawnAsync.mockRejectedValue(error);
    await expect(() => applyPatchAsync('/app', '/app/cng-patches/ios+.patch')).rejects.toThrow(
      /Git is required to apply patches/
    );
  });

  it('should throw from git apply errors', async () => {
    mockedSpawnAsync.mockRejectedValue(new Error('git apply failed'));
    await expect(() => applyPatchAsync('/app', '/app/cng-patches/ios+.patch')).rejects.toThrow();
  });

  it('should not scope the patch when the project is the repository root', async () => {
    // @ts-expect-error: `git rev-parse --show-prefix` reports no prefix
    mockedSpawnAsync.mockResolvedValue({ stdout: '', stderr: '' });

    await applyPatchAsync('/app', '/app/cng-patches/ios+.patch');

    expect(mockedSpawnAsync).toHaveBeenLastCalledWith(
      'git',
      ['apply', '--ignore-whitespace', '/app/cng-patches/ios+.patch'],
      { cwd: '/app' }
    );
  });

  it('should scope the patch to the project directory inside a monorepo', async () => {
    // @ts-expect-error: `git rev-parse --show-prefix` reports the nested project path
    mockedSpawnAsync.mockResolvedValue({ stdout: 'apps/mobile/', stderr: '' });

    await applyPatchAsync('/repo/apps/mobile', '/repo/apps/mobile/cng-patches/ios+.patch');

    expect(mockedSpawnAsync).toHaveBeenLastCalledWith(
      'git',
      [
        'apply',
        '--ignore-whitespace',
        '--directory=apps/mobile/',
        '/repo/apps/mobile/cng-patches/ios+.patch',
      ],
      { cwd: '/repo/apps/mobile' }
    );
  });
});

describe(isPatchAppliedAsync, () => {
  it('should return true when the patch reverse-applies cleanly', async () => {
    // @ts-expect-error: `git rev-parse --show-prefix` then `git apply --reverse --check`
    mockedSpawnAsync.mockResolvedValue({ stdout: '', stderr: '' });

    await expect(isPatchAppliedAsync('/app', '/app/cng-patches/ios+.patch')).resolves.toBe(true);

    expect(mockedSpawnAsync).toHaveBeenLastCalledWith(
      'git',
      ['apply', '--reverse', '--check', '--ignore-whitespace', '/app/cng-patches/ios+.patch'],
      { cwd: '/app' }
    );
  });

  it('should check the patch against the project directory inside a monorepo', async () => {
    // @ts-expect-error: `git rev-parse --show-prefix` reports the nested project path
    mockedSpawnAsync.mockResolvedValue({ stdout: 'apps/mobile/', stderr: '' });

    await expect(
      isPatchAppliedAsync('/repo/apps/mobile', '/repo/apps/mobile/cng-patches/ios+.patch')
    ).resolves.toBe(true);

    expect(mockedSpawnAsync).toHaveBeenLastCalledWith(
      'git',
      [
        'apply',
        '--reverse',
        '--check',
        '--ignore-whitespace',
        '--directory=apps/mobile/',
        '/repo/apps/mobile/cng-patches/ios+.patch',
      ],
      { cwd: '/repo/apps/mobile' }
    );
  });

  it('should return false when the patch is not applied', async () => {
    // @ts-expect-error: `git rev-parse --show-prefix` succeeds, the reverse check does not
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: '', stderr: '' });
    mockedSpawnAsync.mockRejectedValueOnce(new Error('error: patch does not apply'));

    await expect(isPatchAppliedAsync('/app', '/app/cng-patches/ios+.patch')).resolves.toBe(false);
  });

  it('should throw if git is not installed', async () => {
    const error = new Error('spawn git ENOENT');
    // @ts-expect-error: Simulate spawn error
    error.code = 'ENOENT';
    mockedSpawnAsync.mockRejectedValueOnce(error);
    await expect(() => isPatchAppliedAsync('/app', '/app/cng-patches/ios+.patch')).rejects.toThrow(
      /Git is required to apply patches/
    );
  });
});

describe(getPatchChangedLinesAsync, () => {
  it('should return changed lines', async () => {
    const mockPatchContent = `\
1\t1\tandroid/app/build.gradle
1\t3\tandroid/app/src/main/java/com/helloworld/MainApplication.kt`;
    // @ts-expect-error: `git rev-parse --show-prefix` reports no prefix
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: '', stderr: '' });
    // @ts-expect-error
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: mockPatchContent, stderr: '' });
    const changedLines = await getPatchChangedLinesAsync('/app', '/app/test.patch');
    expect(changedLines).toBe(6);
  });

  it('should support movement semantic', async () => {
    const mockPatchContent = `0\t0\tbabel.config.js => babel.config.cjs`;
    // @ts-expect-error: `git rev-parse --show-prefix` reports no prefix
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: '', stderr: '' });
    // @ts-expect-error
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: mockPatchContent, stderr: '' });
    const changedLines = await getPatchChangedLinesAsync('/app', '/app/test.patch');
    expect(changedLines).toBe(0);
  });

  it('should count changed lines from the project directory inside a monorepo', async () => {
    // @ts-expect-error: `git rev-parse --show-prefix` reports the nested project path
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: 'apps/mobile/', stderr: '' });
    // @ts-expect-error
    mockedSpawnAsync.mockResolvedValueOnce({
      stdout: '1\t0\tapps/mobile/ios/mobile/Info.plist',
      stderr: '',
    });

    const changedLines = await getPatchChangedLinesAsync(
      '/repo/apps/mobile',
      '/repo/apps/mobile/cng-patches/ios+.patch'
    );

    expect(changedLines).toBe(1);
    expect(mockedSpawnAsync).toHaveBeenLastCalledWith(
      'git',
      [
        'apply',
        '--numstat',
        '--directory=apps/mobile/',
        '/repo/apps/mobile/cng-patches/ios+.patch',
      ],
      { cwd: '/repo/apps/mobile' }
    );
  });

  it('should support movement semantic with extra changes', async () => {
    const mockPatchContent = `2\t0\tbabel.config.js => babel.config.cjs`;
    // @ts-expect-error: `git rev-parse --show-prefix` reports no prefix
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: '', stderr: '' });
    // @ts-expect-error
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: mockPatchContent, stderr: '' });
    const changedLines = await getPatchChangedLinesAsync('/app', '/app/test.patch');
    expect(changedLines).toBe(2);
  });
});
