// @ref src/passthrough/auth.ts
// The auth commands through the published bin, in the directories that made them a bug: one with
// no Expo app in it at all, and one with an Expo app, which must keep behaving exactly as it did.
//
// Everything here uses stub bins. The point is *which CLI ran and what it was asked*, and a test
// that reached the real service would be testing the account rather than the wrapper.

import fs from 'fs';
import path from 'path';

import {
  executeExagentAsync,
  getTemporaryPath,
  installStubBinAsync,
  setupFixtureAsync,
} from '../utils';

/** One recorded invocation of a stub bin. */
type StubInvocation = { bin: string; args: string[]; cwd: string };

const LOG_NAME = 'auth-invocations.jsonl';

/**
 * A stub that records what it was asked and answers the way the CLI it stands for answers.
 *
 * `eas whoami` prints the name, the email and an account list; `expo whoami` prints the name
 * alone [observed — 2026-08-26, both CLIs live]. Keeping them different is what lets a test tell
 * which one answered from the output rather than only from the log.
 */
function stubScriptFor(bin: 'expo' | 'eas'): string {
  return `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
fs.appendFileSync(
  path.join(process.env.AUTH_LOG_DIR, ${JSON.stringify(LOG_NAME)}),
  JSON.stringify({ bin: ${JSON.stringify(bin)}, args, cwd: process.cwd() }) + '\\n'
);
if (args[0] === 'whoami') {
  process.stdout.write(${
    bin === 'eas' ? "'kudochien\\nkudo@csie.io\\n\\nAccounts:\\n• kudochien (Role: Owner)\\n'" : "'kudochien\\n'"
  });
}
process.exit(0);
`;
}

/** A directory with no project in it, holding whichever stub bins the test wants. */
async function setupBareDirAsync(bins: ('expo' | 'eas')[]): Promise<string> {
  const created = getTemporaryPath();
  await fs.promises.mkdir(created, { recursive: true });
  // The real path, because that is what a subprocess reports as its working directory: on macOS
  // the temporary directory is reached through a symlink.
  const dir = await fs.promises.realpath(created);
  const binDir = path.join(dir, 'node_modules', '.bin');
  for (const bin of bins) {
    const script = path.join(dir, `${bin}-stub.js`);
    await fs.promises.writeFile(script, stubScriptFor(bin));
    await installStubBinAsync(binDir, bin, script);
  }
  return dir;
}

function readInvocations(dir: string): StubInvocation[] {
  const file = path.join(dir, LOG_NAME);
  if (!fs.existsSync(file)) {
    return [];
  }
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as StubInvocation);
}

/** `PATH` with nothing on it that could answer as `eas` or `expo`. */
function isolatedEnv(dir: string): Record<string, string> {
  return { AUTH_LOG_DIR: dir, PATH: [path.dirname(process.execPath), '/usr/bin', '/bin'].join(':') };
}

describe('auth commands outside an Expo project', () => {
  it(`should answer whoami with the project's eas CLI when there is no expo`, async () => {
    const dir = await setupBareDirAsync(['eas']);

    const result = await executeExagentAsync(dir, ['whoami'], { env: isolatedEnv(dir) });

    expect(readInvocations(dir)).toEqual([
      { bin: 'eas', args: ['whoami'], cwd: expect.any(String) },
    ]);
    // The answer is the EAS CLI's, on stdout, with nothing of this wrapper's mixed into it.
    expect(result.stdout).toContain('kudochien');
    expect(result.stdout).not.toContain('Using the EAS CLI');
    // The note about which CLI answered is on stderr, so a caller parsing the name is unaffected.
    expect(result.stderr).toContain('Using the EAS CLI');
    expect(result.stderr).toContain('~/.expo/state.json');
  });

  it(`should forward the arguments it was given`, async () => {
    const dir = await setupBareDirAsync(['eas']);

    await executeExagentAsync(dir, ['login', '--help'], { env: isolatedEnv(dir) });

    expect(readInvocations(dir)[0]?.args).toEqual(['login', '--help']);
  });

  it(`should say so rather than run a command the EAS CLI does not have`, async () => {
    const dir = await setupBareDirAsync(['eas']);

    const eventsFile = path.join(dir, 'events.jsonl');
    const result = await executeExagentAsync(dir, ['register'], {
      env: { ...isolatedEnv(dir), LOG_EVENTS: eventsFile },
      reject: false,
    });

    expect(result.exitCode).not.toBe(0);
    expect(result.all).toContain('There is no CLI here that can run "register"');
    expect(result.all).toContain('https://expo.dev/signup');
    // The code is the machine half of the contract, and it rides the event stream.
    expect(fs.readFileSync(eventsFile, 'utf8')).toContain('AUTH_COMMAND_UNAVAILABLE');
    // Nothing was spawned: the dead end is reported before anything runs.
    expect(readInvocations(dir)).toEqual([]);
  });

  it(`should use an eas found on PATH when the directory has none of its own`, async () => {
    const dir = await setupBareDirAsync([]);
    const pathDir = path.join(dir, 'path-bin');
    const script = path.join(dir, 'eas-stub.js');
    await fs.promises.writeFile(script, stubScriptFor('eas'));
    await installStubBinAsync(pathDir, 'eas', script);

    await executeExagentAsync(dir, ['whoami'], {
      env: { ...isolatedEnv(dir), PATH: `${pathDir}:${isolatedEnv(dir).PATH}` },
    });

    // Two runs: the `--version` probe that checks the binary is really the CLI, then the command.
    expect(readInvocations(dir).map((run) => run.args)).toEqual([['--version'], ['whoami']]);
  });
});

describe('auth commands inside an Expo project', () => {
  it(`should keep forwarding to the project's own expo CLI`, async () => {
    const projectRoot = await fs.promises.realpath(await setupFixtureAsync('go-app'));
    const script = path.join(projectRoot, 'expo-auth-stub.js');
    await fs.promises.writeFile(script, stubScriptFor('expo'));
    await installStubBinAsync(path.join(projectRoot, 'node_modules', '.bin'), 'expo', script);

    const result = await executeExagentAsync(projectRoot, ['whoami'], {
      env: isolatedEnv(projectRoot),
    });

    expect(readInvocations(projectRoot)).toEqual([
      { bin: 'expo', args: ['whoami'], cwd: expect.any(String) },
    ]);
    // No note, because nothing surprising happened: the project's CLI answered about the project.
    expect(result.stderr).not.toContain('Using the EAS CLI');
  });

  it(`should prefer the project's expo even when it also has an eas`, async () => {
    const projectRoot = await fs.promises.realpath(await setupFixtureAsync('go-app'));
    const binDir = path.join(projectRoot, 'node_modules', '.bin');
    for (const bin of ['expo', 'eas'] as const) {
      const script = path.join(projectRoot, `${bin}-auth-stub.js`);
      await fs.promises.writeFile(script, stubScriptFor(bin));
      await installStubBinAsync(binDir, bin, script);
    }

    await executeExagentAsync(projectRoot, ['logout'], { env: isolatedEnv(projectRoot) });

    expect(readInvocations(projectRoot).map((run) => run.bin)).toEqual(['expo']);
  });
});
