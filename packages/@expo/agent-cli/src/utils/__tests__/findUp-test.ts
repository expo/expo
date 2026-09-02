import fs from 'fs';
import { vol } from 'memfs';
import path from 'path';

import { CommandError } from '../errors';
import { findUpProjectRootOrAssert, findUpProjectRootOrCwd } from '../findUp';

jest.mock('fs');

const originalNative = fs.realpathSync.native;

afterEach(() => {
  vol.reset();
  jest.restoreAllMocks();
  Object.defineProperty(fs.realpathSync, 'native', {
    value: originalNative,
    configurable: true,
    writable: true,
  });
});

const repo = path.resolve('/repo');
const mobile = path.join(repo, 'apps', 'mobile');
const elsewhere = path.resolve('/elsewhere');

describe(findUpProjectRootOrAssert, () => {
  it(`should answer the directory holding the package.json`, () => {
    vol.fromJSON({ [path.join(repo, 'package.json')]: '{}' });

    expect(findUpProjectRootOrAssert(repo)).toBe(repo);
  });

  it(`should walk up to the nearest package.json, which is what a workspace has`, () => {
    vol.fromJSON({
      [path.join(repo, 'package.json')]: '{}',
      [path.join(mobile, 'package.json')]: '{}',
    });

    expect(findUpProjectRootOrAssert(path.join(mobile, 'src'))).toBe(mobile);
  });

  it(`should keep this platform's path when realpath answers in POSIX`, () => {
    // memfs on Windows returns `/repo/package.json` for a file the walk found at `D:\repo\...`.
    vol.fromJSON({ [path.join(repo, 'package.json')]: '{}' });
    Object.defineProperty(fs.realpathSync, 'native', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    jest.spyOn(fs, 'realpathSync').mockReturnValue('/repo/package.json');

    expect(findUpProjectRootOrAssert(repo)).toBe(repo);
  });

  it(`should prefer native realpath so Windows 8.3 names expand`, () => {
    vol.fromJSON({ [path.join(repo, 'package.json')]: '{}' });
    const native = jest.fn(() => path.join(repo, 'long-name', 'package.json'));
    Object.defineProperty(fs.realpathSync, 'native', {
      value: native,
      configurable: true,
      writable: true,
    });

    expect(findUpProjectRootOrAssert(repo)).toBe(path.join(repo, 'long-name'));
    expect(native).toHaveBeenCalled();
  });

  // @ref .claude/CLAUDE.md §Error messages — what, why, how, and a next step even when the exact
  // fix is unknown. This is the first error a caller in the wrong directory sees, and an agent that
  // reads it has to be able to act on it: it used to be one clause with no reason and no recovery,
  // and `suggestedCommand` was null, so there was nothing on the `Try:` line at all.
  it(`should say what, why and how, and name a command to run`, () => {
    vol.fromJSON({ [path.join(elsewhere, '.keep')]: '' });

    let thrown: CommandError | null = null;
    try {
      findUpProjectRootOrAssert(elsewhere);
    } catch (error: unknown) {
      thrown = error as CommandError;
    }

    expect(thrown).toBeInstanceOf(CommandError);
    expect(thrown!.code).toBe('NO_PROJECT');
    // The directory it looked in, because "not found" without it is unactionable.
    expect(thrown!.message).toContain(elsewhere);
    expect(thrown!.message).toContain('Why:');
    expect(thrown!.message).toContain('How:');
    // A `Try:` line an agent can run, rather than a dead end.
    expect(thrown!.suggestedCommand).toBe('npx @expo/agent-cli new my-app');
  });
});

describe(findUpProjectRootOrCwd, () => {
  it(`should answer the directory itself when it is inside no project`, () => {
    vol.fromJSON({ [path.join(elsewhere, '.keep')]: '' });

    expect(findUpProjectRootOrCwd(elsewhere)).toBe(elsewhere);
  });

  it(`should answer the project root when there is one`, () => {
    vol.fromJSON({ [path.join(repo, 'package.json')]: '{}' });

    expect(findUpProjectRootOrCwd(path.join(repo, 'src'))).toBe(repo);
  });
});
