import { vol } from 'memfs';

import { CommandError } from '../errors';
import { findUpProjectRootOrAssert, findUpProjectRootOrCwd } from '../findUp';

jest.mock('fs');

afterEach(() => vol.reset());

describe(findUpProjectRootOrAssert, () => {
  it(`should answer the directory holding the package.json`, () => {
    vol.fromJSON({ '/repo/package.json': '{}' });

    expect(findUpProjectRootOrAssert('/repo')).toBe('/repo');
  });

  it(`should walk up to the nearest package.json, which is what a workspace has`, () => {
    vol.fromJSON({ '/repo/package.json': '{}', '/repo/apps/mobile/package.json': '{}' });

    expect(findUpProjectRootOrAssert('/repo/apps/mobile/src')).toBe('/repo/apps/mobile');
  });

  // @ref .claude/CLAUDE.md §Error messages — what, why, how, and a next step even when the exact
  // fix is unknown. This is the first error a caller in the wrong directory sees, and an agent that
  // reads it has to be able to act on it: it used to be one clause with no reason and no recovery,
  // and `suggestedCommand` was null, so there was nothing on the `Try:` line at all.
  it(`should say what, why and how, and name a command to run`, () => {
    vol.fromJSON({ '/elsewhere/.keep': '' });

    let thrown: CommandError | null = null;
    try {
      findUpProjectRootOrAssert('/elsewhere');
    } catch (error: unknown) {
      thrown = error as CommandError;
    }

    expect(thrown).toBeInstanceOf(CommandError);
    expect(thrown!.code).toBe('NO_PROJECT');
    // The directory it looked in, because "not found" without it is unactionable.
    expect(thrown!.message).toContain('/elsewhere');
    expect(thrown!.message).toContain('Why:');
    expect(thrown!.message).toContain('How:');
    // A `Try:` line an agent can run, rather than a dead end.
    expect(thrown!.suggestedCommand).toBe('npx exagent new my-app');
  });
});

describe(findUpProjectRootOrCwd, () => {
  it(`should answer the directory itself when it is inside no project`, () => {
    vol.fromJSON({ '/elsewhere/.keep': '' });

    expect(findUpProjectRootOrCwd('/elsewhere')).toBe('/elsewhere');
  });

  it(`should answer the project root when there is one`, () => {
    vol.fromJSON({ '/repo/package.json': '{}' });

    expect(findUpProjectRootOrCwd('/repo/src')).toBe('/repo');
  });
});
