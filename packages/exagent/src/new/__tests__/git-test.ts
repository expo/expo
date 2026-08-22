import { vol } from 'memfs';

import { spawnCaptureAsync } from '../../utils/spawnCapture';
import { resolveGitStateAsync } from '../git';

jest.mock('../../utils/spawnCapture');

const projectRoot = '/tmp/my-app';

/** `git rev-parse --is-inside-work-tree` answers with a word and an exit code, in that order. */
function mockGit(results: { stdout?: string; exitCode: number | null; spawnError?: any }[]) {
  const mock = jest.mocked(spawnCaptureAsync);
  for (const result of results) {
    mock.mockResolvedValueOnce({
      stdout: result.stdout ?? '',
      stderr: '',
      exitCode: result.exitCode,
      spawnError: result.spawnError,
    });
  }
  return mock;
}

afterEach(() => {
  vol.reset();
});

describe(resolveGitStateAsync, () => {
  it(`should not touch git when --no-git was passed`, async () => {
    const mock = mockGit([]);

    await expect(resolveGitStateAsync(projectRoot, { git: false })).resolves.toEqual({
      initialized: false,
      detail: 'skipped (--no-git)',
    });
    expect(mock).not.toHaveBeenCalled();
  });

  it(`should report the repository create-expo already initialized`, async () => {
    // create-expo runs `git init` itself, so the common case must not run a second one.
    vol.fromJSON({ [`${projectRoot}/.git/HEAD`]: 'ref: refs/heads/main' });
    const mock = mockGit([]);

    await expect(resolveGitStateAsync(projectRoot, { git: true })).resolves.toEqual({
      initialized: true,
      detail: 'initialized by create-expo',
    });
    expect(mock).not.toHaveBeenCalled();
  });

  it(`should skip a project created inside an existing repository`, async () => {
    const mock = mockGit([{ stdout: 'true\n', exitCode: 0 }]);

    await expect(resolveGitStateAsync(projectRoot, { git: true })).resolves.toEqual({
      initialized: false,
      detail: 'skipped (inside an existing git repository)',
    });
    expect(mock).toHaveBeenCalledTimes(1);
    expect(mock).toHaveBeenCalledWith('git', ['rev-parse', '--is-inside-work-tree'], {
      cwd: projectRoot,
    });
  });

  it(`should initialize a repository when the project is not in one`, async () => {
    const mock = mockGit([{ stdout: 'false\n', exitCode: 128 }, { exitCode: 0 }]);

    await expect(resolveGitStateAsync(projectRoot, { git: true })).resolves.toEqual({
      initialized: true,
      detail: 'initialized',
    });
    expect(mock).toHaveBeenNthCalledWith(2, 'git', ['init'], { cwd: projectRoot });
  });

  it(`should tolerate git missing from the machine`, async () => {
    const enoent = Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' });
    mockGit([{ exitCode: null, spawnError: enoent }]);

    await expect(resolveGitStateAsync(projectRoot, { git: true })).resolves.toEqual({
      initialized: false,
      detail: 'skipped (git is not available)',
    });
  });

  it(`should report a failed git init instead of throwing`, async () => {
    mockGit([{ stdout: 'false\n', exitCode: 128 }, { exitCode: 1 }]);

    await expect(resolveGitStateAsync(projectRoot, { git: true })).resolves.toEqual({
      initialized: false,
      detail: 'skipped (git init failed)',
    });
  });
});
