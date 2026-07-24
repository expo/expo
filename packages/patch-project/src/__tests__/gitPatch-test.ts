import spawnAsync from '@expo/spawn-async';

import { applyPatchAsync, getPatchChangedLinesAsync, isPatchAppliedAsync } from '../gitPatch';

jest.mock('@expo/spawn-async');
jest.mock('fs');
const mockedSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;

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
});

describe(isPatchAppliedAsync, () => {
  it('should return true when the patch reverse-applies cleanly', async () => {
    // @ts-expect-error
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: '', stderr: '' });
    await expect(isPatchAppliedAsync('/app', '/app/cng-patches/ios+.patch')).resolves.toBe(true);
    expect(mockedSpawnAsync).toHaveBeenCalledWith(
      'git',
      ['apply', '--reverse', '--check', '--ignore-whitespace', '/app/cng-patches/ios+.patch'],
      { cwd: '/app' }
    );
  });

  it('should return false when the patch is not applied', async () => {
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
    // @ts-expect-error
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: mockPatchContent, stderr: '' });
    const changedLines = await getPatchChangedLinesAsync('/app/test.patch');
    expect(changedLines).toBe(6);
  });

  it('should support movement semantic', async () => {
    const mockPatchContent = `0\t0\tbabel.config.js => babel.config.cjs`;
    // @ts-expect-error
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: mockPatchContent, stderr: '' });
    const changedLines = await getPatchChangedLinesAsync('/app/test.patch');
    expect(changedLines).toBe(0);
  });

  it('should support movement semantic with extra changes', async () => {
    const mockPatchContent = `2\t0\tbabel.config.js => babel.config.cjs`;
    // @ts-expect-error
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: mockPatchContent, stderr: '' });
    const changedLines = await getPatchChangedLinesAsync('/app/test.patch');
    expect(changedLines).toBe(2);
  });
});
