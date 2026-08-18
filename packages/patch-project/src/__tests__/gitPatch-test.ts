import spawnAsync from '@expo/spawn-async';

import { applyPatchAsync, getGitRootAsync, getPatchChangedLinesAsync } from '../gitPatch';

jest.mock('@expo/spawn-async');
jest.mock('fs');
const mockedSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;

describe(getGitRootAsync, () => {
  it('should return git root from rev-parse', async () => {
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: '/repo\n', stderr: '' });
    const root = await getGitRootAsync('/repo/apps/mobile');
    expect(root).toBe('/repo');
  });

  it('should fallback to projectRoot when git is not available', async () => {
    const error = new Error('spawn git ENOENT');
    // @ts-expect-error: Simulate spawn error
    error.code = 'ENOENT';
    mockedSpawnAsync.mockRejectedValueOnce(error);
    const root = await getGitRootAsync('/app');
    expect(root).toBe('/app');
  });
});

describe(applyPatchAsync, () => {
  it('should pass --directory when projectRoot is nested in git repo (monorepo)', async () => {
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: '/repo\n', stderr: '' });
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: '', stderr: '' });

    await applyPatchAsync('/repo/apps/mobile', '/repo/apps/mobile/cng-patches/ios+.patch');

    expect(mockedSpawnAsync).toHaveBeenCalledTimes(2);
    const applyCall = mockedSpawnAsync.mock.calls[1];
    expect(applyCall[0]).toEqual('git');
    expect(applyCall[1]).toEqual([
      'apply',
      '--ignore-whitespace',
      '--directory',
      'apps/mobile',
      '/repo/apps/mobile/cng-patches/ios+.patch',
    ]);
    expect(applyCall[2]).toEqual({ cwd: '/repo/apps/mobile' });
  });

  it('should not pass --directory when projectRoot is git root', async () => {
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: '/app\n', stderr: '' });
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: '', stderr: '' });

    await applyPatchAsync('/app', '/app/cng-patches/ios+.patch');

    expect(mockedSpawnAsync).toHaveBeenCalledTimes(2);
    const applyCall = mockedSpawnAsync.mock.calls[1];
    expect(applyCall[0]).toEqual('git');
    expect(applyCall[1]).toEqual([
      'apply',
      '--ignore-whitespace',
      '/app/cng-patches/ios+.patch',
    ]);
    expect(applyCall[2]).toEqual({ cwd: '/app' });
  });

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
    mockedSpawnAsync.mockResolvedValueOnce({ stdout: '/app\n', stderr: '' });
    mockedSpawnAsync.mockRejectedValueOnce(new Error('git apply failed'));
    await expect(() => applyPatchAsync('/app', '/app/cng-patches/ios+.patch')).rejects.toThrow();
  });
});

describe(getPatchChangedLinesAsync, () => {
  it('should return changed lines', async () => {
    const mockPatchContent = `\n1\t1\tandroid/app/build.gradle
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
