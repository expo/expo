import { vol } from 'memfs';

import * as subprocess from '../../utils/subprocess';
import { readAuthPreflightAsync, resetAuthPreflightCache } from '../preflight';

const projectRoot = '/project';

/** Answer the one `eas whoami` run of a preflight. */
function mockWhoami(result: Partial<subprocess.SubprocessResult>) {
  return jest
    .spyOn(subprocess, 'spawnSubprocessAsync')
    .mockResolvedValue({ exitCode: 0, stdout: '', stderr: '', ...result });
}

/** A project whose own `eas` bin is the one that would run. */
function withProjectEas() {
  vol.fromJSON({ [`${projectRoot}/node_modules/.bin/eas`]: '#!/bin/sh' });
}

beforeEach(() => {
  vol.reset();
  resetAuthPreflightCache();
  delete process.env.EXPO_TOKEN;
});

describe(readAuthPreflightAsync, () => {
  it('reports the account the EAS CLI named', async () => {
    withProjectEas();
    mockWhoami({ exitCode: 0, stdout: 'kudo\n' });

    await expect(readAuthPreflightAsync(projectRoot)).resolves.toEqual({
      loggedIn: true,
      user: 'kudo',
      source: 'eas whoami',
    });
  });

  it('reads the answer out of the last line the CLI printed', async () => {
    withProjectEas();
    mockWhoami({ exitCode: 0, stdout: 'A new version of eas-cli is available\nkudo@expo.dev\n' });

    await expect(readAuthPreflightAsync(projectRoot)).resolves.toMatchObject({
      user: 'kudo@expo.dev',
    });
  });

  it('reports a signed-out machine as signed out', async () => {
    withProjectEas();
    mockWhoami({ exitCode: 1, stderr: 'Not logged in\n' });

    await expect(readAuthPreflightAsync(projectRoot)).resolves.toEqual({
      loggedIn: false,
      user: null,
      source: 'eas whoami',
    });
  });

  // A token the service rejected is what a bare "the variable is set" check would call a login.
  it('trusts the CLI over the variable when both could speak', async () => {
    withProjectEas();
    process.env.EXPO_TOKEN = 'expired';
    mockWhoami({ exitCode: 1, stderr: 'Not logged in\n' });

    await expect(readAuthPreflightAsync(projectRoot)).resolves.toMatchObject({
      loggedIn: false,
      source: 'eas whoami',
    });
  });

  it('falls back to the token when there is no EAS CLI to ask', async () => {
    process.env.EXPO_TOKEN = 'token';
    const spawned = mockWhoami({ exitCode: 0 });

    await expect(readAuthPreflightAsync(projectRoot, { timeoutMs: 10 })).resolves.toEqual({
      loggedIn: true,
      user: null,
      source: 'EXPO_TOKEN',
    });
    expect(spawned).not.toHaveBeenCalled();
  });

  it('answers "unknown" rather than "signed out" when nothing could be asked', async () => {
    await expect(readAuthPreflightAsync(projectRoot)).resolves.toEqual({
      loggedIn: null,
      user: null,
      source: null,
    });
  });

  it('answers "unknown" when the CLI took too long', async () => {
    withProjectEas();
    mockWhoami({ exitCode: null, timedOut: true });

    await expect(readAuthPreflightAsync(projectRoot)).resolves.toMatchObject({ loggedIn: null });
  });

  // The difference that matters: a binary that is not the EAS CLI exits non-zero exactly like a
  // signed-out one, and calling that "signed out" would stop a command that had every right to
  // run and hand the user a login they do not need.
  it('answers "unknown" when the binary under that name is not the CLI', async () => {
    withProjectEas();
    mockWhoami({
      exitCode: 101,
      stderr: 'Caused by:\n    No such file or directory (os error 2)\n\nStack backtrace:\n   2: tuft::main\n',
    });

    await expect(readAuthPreflightAsync(projectRoot)).resolves.toEqual({
      loggedIn: null,
      user: null,
      source: null,
    });
  });

  it('answers "unknown" when the CLI could not be started', async () => {
    withProjectEas();
    mockWhoami({
      exitCode: null,
      spawnError: Object.assign(new Error('nope'), { code: 'EACCES' }),
    });

    await expect(readAuthPreflightAsync(projectRoot)).resolves.toMatchObject({ loggedIn: null });
  });

  it('spawns once however often it is asked', async () => {
    withProjectEas();
    const spawned = mockWhoami({ exitCode: 0, stdout: 'kudo\n' });

    const [first, second] = await Promise.all([
      readAuthPreflightAsync(projectRoot),
      readAuthPreflightAsync(projectRoot),
    ]);

    expect(spawned).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    // Including a caller that arrives after the answer has already landed.
    expect(await readAuthPreflightAsync(projectRoot)).toBe(first);
    expect(spawned).toHaveBeenCalledTimes(1);
  });

  it('gives the CLI a deadline, so status stays instant', async () => {
    withProjectEas();
    const spawned = mockWhoami({ exitCode: 0, stdout: 'kudo\n' });

    await readAuthPreflightAsync(projectRoot, { timeoutMs: 1234 });

    expect(spawned).toHaveBeenCalledWith(
      expect.stringContaining('eas'),
      ['whoami'],
      expect.objectContaining({ timeoutMs: 1234 })
    );
  });
});
