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
  it(`should not touch git when --no-git was passed and there is no repository`, async () => {
    const mock = mockGit([]);

    await expect(
      resolveGitStateAsync(projectRoot, { git: false, createdProjectDirectory: true })
    ).resolves.toEqual({
      initialized: false,
      detail: 'skipped (--no-git)',
    });
    expect(mock).not.toHaveBeenCalled();
  });

  // @ref llp/0010-agent-conventions.rfc.md §Upstream asks
  //
  // F110. `create-expo` runs `git init` itself and has **no flag to skip it** [observed —
  // `create-expo@latest --help`, 2026-08-28], so `--no-git` used to return this answer without
  // looking: the project came out a git repository with an "Initial commit" in it, and both the
  // `--json` field documented as "the project is its own git repository" and the printed
  // `Git  skipped (--no-git)` line said otherwise [observed — live, 2026-08-28, wave 27]. The flag
  // now does what it says, and the repository it removes is only ever the one create-expo just made.
  it(`should remove the repository create-expo made when --no-git was passed`, async () => {
    vol.fromJSON({
      [`${projectRoot}/.git/HEAD`]: 'ref: refs/heads/main',
      [`${projectRoot}/package.json`]: '{}',
    });

    await expect(
      resolveGitStateAsync(projectRoot, { git: false, createdProjectDirectory: true })
    ).resolves.toEqual({
      initialized: false,
      detail: 'skipped (--no-git); create-expo initializes git itself, so its repository was removed',
    });
    expect(vol.existsSync(`${projectRoot}/.git`)).toBe(false);
    // Only the repository. The project it wrapped is the whole point of the command.
    expect(vol.existsSync(`${projectRoot}/package.json`)).toBe(true);
  });

  // The guard, and the reason it is "did this command create the directory" rather than "is there a
  // repository": running `new` into a directory that already existed can mean a repository that was
  // already there, and deleting somebody's history is not a thing a scaffolding flag may do.
  it(`should never remove a repository from a directory it did not create`, async () => {
    vol.fromJSON({ [`${projectRoot}/.git/HEAD`]: 'ref: refs/heads/main' });

    await expect(
      resolveGitStateAsync(projectRoot, { git: false, createdProjectDirectory: false })
    ).resolves.toEqual({
      initialized: true,
      detail:
        'left alone (--no-git does not remove a repository that was here before this command)',
    });
    expect(vol.existsSync(`${projectRoot}/.git`)).toBe(true);
  });

  it(`should report the repository create-expo already initialized`, async () => {
    // create-expo runs `git init` itself, so the common case must not run a second one.
    vol.fromJSON({ [`${projectRoot}/.git/HEAD`]: 'ref: refs/heads/main' });
    const mock = mockGit([]);

    await expect(resolveGitStateAsync(projectRoot, { git: true, createdProjectDirectory: true })).resolves.toEqual({
      initialized: true,
      detail: 'initialized by create-expo',
    });
    expect(mock).not.toHaveBeenCalled();
  });

  it(`should skip a project created inside an existing repository`, async () => {
    const mock = mockGit([{ stdout: 'true\n', exitCode: 0 }]);

    await expect(resolveGitStateAsync(projectRoot, { git: true, createdProjectDirectory: true })).resolves.toEqual({
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

    await expect(resolveGitStateAsync(projectRoot, { git: true, createdProjectDirectory: true })).resolves.toEqual({
      initialized: true,
      detail: 'initialized',
    });
    expect(mock).toHaveBeenNthCalledWith(2, 'git', ['init'], { cwd: projectRoot });
  });

  it(`should tolerate git missing from the machine`, async () => {
    const enoent = Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' });
    mockGit([{ exitCode: null, spawnError: enoent }]);

    await expect(resolveGitStateAsync(projectRoot, { git: true, createdProjectDirectory: true })).resolves.toEqual({
      initialized: false,
      detail: 'skipped (git is not available)',
    });
  });

  it(`should report a failed git init instead of throwing`, async () => {
    mockGit([{ stdout: 'false\n', exitCode: 128 }, { exitCode: 1 }]);

    await expect(resolveGitStateAsync(projectRoot, { git: true, createdProjectDirectory: true })).resolves.toEqual({
      initialized: false,
      detail: 'skipped (git init failed)',
    });
  });
});
