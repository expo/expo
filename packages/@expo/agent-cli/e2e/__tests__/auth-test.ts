// @ref src/passthrough/auth.ts
// The auth commands through the published bin, in the directories that made them a bug: one with
// no Expo app in it at all, and one with an Expo app, which must keep behaving exactly as it did.
//
// Everything here uses stub bins. The point is *which CLI ran and what it was asked*, and a test
// that reached the real service would be testing the account rather than the wrapper.

import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  executeAgentCliAsync,
  getTemporaryPath,
  installStubBinAsync,
  pathEnvVars,
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
    bin === 'eas'
      ? "'alice\\nalice@example.com\\n\\nAccounts:\\n• alice (Role: Owner)\\n'"
      : "'alice\\n'"
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
  // And a stub package runner on `PATH`, always. It is the only way the EAS side of this chain
  // reaches a CLI (`src/utils/easCli.ts`, wave 18), and a suite without it would either run the
  // real npx — downloading eas-cli — or fail to spawn at all.
  await installStubRunnerAsync(dir);
  return dir;
}

/**
 * An `npx` on `PATH` that records what it was asked and downloads nothing.
 *
 * Only `register` reaches a package runner, and what the test needs to know is the argv it was
 * handed. Letting the real `npx` run would fetch the `expo` package and then hand an interactive
 * signup a terminal, which is two things a test must not do.
 */
async function installStubRunnerAsync(dir: string): Promise<void> {
  const script = path.join(dir, 'npx-stub.js');
  await fs.promises.writeFile(
    script,
    `#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
fs.appendFileSync(
  path.join(process.env.AUTH_LOG_DIR, ${JSON.stringify(LOG_NAME)}),
  JSON.stringify({ bin: 'npx', args, cwd: process.cwd() }) + '\\n'
);
// What the package was asked to do, with the runner's own flag and the spec stripped off.
const rest = args[0] === '--yes' ? args.slice(1) : args;
const spec = rest[0] || '';
const verb = rest[1];
if (spec.startsWith('eas-cli') && verb === 'whoami') {
  process.stdout.write('alice\\nalice@example.com\\n\\nAccounts:\\n• alice (Role: Owner)\\n');
}
if (spec === 'expo' && verb === 'whoami') {
  process.stdout.write('alice\\n');
}
process.exit(0);
`
  );
  await installStubBinAsync(path.join(dir, 'path-bin'), 'npx', script);
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

/**
 * `PATH` with nothing on it that could answer as `eas` or `expo` — and the stub runner, which is
 * what every EAS-backed invocation goes through.
 */
function isolatedEnv(dir: string): Record<string, string> {
  return {
    AUTH_LOG_DIR: dir,
    ...pathEnvVars(
      [path.join(dir, 'path-bin'), path.dirname(process.execPath), '/usr/bin', '/bin'].join(
        path.delimiter
      )
    ),
  };
}

describe('auth commands outside an Expo project', () => {
  it(`should answer whoami with the EAS CLI through the package runner when there is no expo`, async () => {
    const dir = await setupBareDirAsync([]);

    const result = await executeAgentCliAsync(dir, ['whoami'], { env: isolatedEnv(dir) });

    // `--yes` and the spec ahead of the verb. `@latest` because a bare directory declares nothing.
    expect(readInvocations(dir)).toEqual([
      { bin: 'npx', args: ['--yes', 'eas-cli@latest', 'whoami'], cwd: expect.any(String) },
    ]);
    // The answer is the EAS CLI's, on stdout, with nothing of this wrapper's mixed into it.
    expect(result.stdout).toContain('alice');
    expect(result.stdout).not.toContain('Using the EAS CLI');
    // The note about which CLI answered is on stderr, so a caller parsing the name is unaffected.
    expect(result.stderr).toContain('Using the EAS CLI');
    // The file that will actually be read, spelled out: `~/.expo/state.json` was printed as
    // though it were the only answer, and under EXPO_STAGING it is not (S6).
    expect(result.stderr).toContain(path.join(os.homedir(), '.expo', 'state.json'));
  });

  // @ref llp/0021-honest-reports.rfc.md §How they show up —
  // live staging, S6. The whole family reads `.expo-staging` under this variable.
  it(`should name the staging session file under EXPO_STAGING`, async () => {
    const dir = await setupBareDirAsync(['eas']);

    const result = await executeAgentCliAsync(dir, ['whoami'], {
      env: { ...isolatedEnv(dir), EXPO_STAGING: '1' },
    });

    expect(result.stderr).toContain(path.join(os.homedir(), '.expo-staging', 'state.json'));
    expect(result.stderr).not.toContain(path.join(os.homedir(), '.expo', 'state.json'));
  });

  // @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — live staging, S7. `--json` is
  // this CLI's contract and neither CLI it forwards to has such a flag, so the flag was ignored and
  // an agent that asked for one object got a line of prose.
  it(`should answer whoami --json with one object`, async () => {
    const dir = await setupBareDirAsync(['eas']);

    const result = await executeAgentCliAsync(dir, ['whoami', '--json'], {
      env: isolatedEnv(dir),
    });

    expect(JSON.parse(result.stdout)).toEqual({
      loggedIn: true,
      user: 'alice',
      source: 'eas whoami',
      sessionFile: path.join(os.homedir(), '.expo', 'state.json'),
      cli: expect.stringContaining('eas'),
    });
    // The flag is this CLI's, so it is not passed on to a CLI that has no such option.
    expect(readInvocations(dir)[0]?.args).toEqual(['--yes', 'eas-cli@latest', 'whoami']);
  });

  it(`should forward the arguments it was given`, async () => {
    const dir = await setupBareDirAsync([]);

    await executeAgentCliAsync(dir, ['login', '--help'], { env: isolatedEnv(dir) });

    expect(readInvocations(dir)[0]?.args).toEqual(['--yes', 'eas-cli@latest', 'login', '--help']);
  });

  // `register` is the one command that does not take the EAS fallback, because there is no
  // `eas register` to take. It reaches for `npx expo` instead — the download the other three were
  // changed to avoid, accepted here because creating an account happens once.
  //
  // The `npx` on `PATH` is a stub: a test that ran the real one would download an SDK, and a test
  // that ran the real `expo register` would try to create an account.
  it(`should run expo register through the package runner, not any eas`, async () => {
    const dir = await setupBareDirAsync(['eas']);

    const eventsFile = path.join(dir, 'events.jsonl');
    const result = await executeAgentCliAsync(dir, ['register'], {
      env: { ...isolatedEnv(dir), LOG_EVENTS: eventsFile },
    });

    expect(result.exitCode).toBe(0);
    // The expo package and the verb, in that order — and the project's `eas` was left alone.
    expect(readInvocations(dir)).toEqual([
      { bin: 'npx', args: ['expo', 'register'], cwd: expect.any(String) },
    ]);
    expect(fs.readFileSync(eventsFile, 'utf8')).toContain('runner-expo');
  });

  it(`should say which CLI runs register, on stderr, and warn about the download`, async () => {
    const dir = await setupBareDirAsync(['eas']);

    const result = await executeAgentCliAsync(dir, ['register'], {
      env: isolatedEnv(dir),
    });

    expect(result.stderr).toContain('npx expo');
    expect(result.stderr).toContain('download');
    // The same discipline the other three keep: notes go on stderr, never into stdout.
    expect(result.stdout).not.toContain('Using the Expo CLI');
  });

  it(`should use the project's own expo for register when there is one`, async () => {
    const dir = await setupBareDirAsync(['expo', 'eas']);

    const result = await executeAgentCliAsync(dir, ['register'], { env: isolatedEnv(dir) });

    expect(readInvocations(dir)).toEqual([
      { bin: 'expo', args: ['register'], cwd: expect.any(String) },
    ]);
    // Nothing to announce: the project's own CLI is what a reader already assumes ran.
    expect(result.stderr).not.toContain('Using the');
  });

  // @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints
  // There used to be a rung here for an `eas` on `PATH`, guarded by a `--version` probe because a
  // binary under that name can be a wrapper, a shim or a stale link — the machine this was written
  // on has exactly that. Both are gone: a runner resolves a *package*, so a file called `eas` is
  // never a candidate, and there is nothing left to probe (`src/utils/easCli.ts`, wave 18).
  it(`should never spawn a stray eas on PATH, and never probe one`, async () => {
    const dir = await setupBareDirAsync([]);
    const easOnPath = path.join(dir, 'path-bin');
    const script = path.join(dir, 'eas-stub.js');
    await fs.promises.writeFile(script, stubScriptFor('eas'));
    await installStubBinAsync(easOnPath, 'eas', script);

    await executeAgentCliAsync(dir, ['whoami'], { env: isolatedEnv(dir) });

    // One invocation, and it is the runner's. Nothing recorded a `--version`, because nothing asked.
    expect(readInvocations(dir)).toEqual([
      { bin: 'npx', args: ['--yes', 'eas-cli@latest', 'whoami'], cwd: expect.any(String) },
    ]);
  });
});

describe('auth commands inside an Expo project', () => {
  it(`should keep forwarding to the project's own expo CLI`, async () => {
    const projectRoot = await fs.promises.realpath(await setupFixtureAsync('go-app'));
    const script = path.join(projectRoot, 'expo-auth-stub.js');
    await fs.promises.writeFile(script, stubScriptFor('expo'));
    await installStubBinAsync(path.join(projectRoot, 'node_modules', '.bin'), 'expo', script);

    const result = await executeAgentCliAsync(projectRoot, ['whoami'], {
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

    await executeAgentCliAsync(projectRoot, ['logout'], { env: isolatedEnv(projectRoot) });

    expect(readInvocations(projectRoot).map((run) => run.bin)).toEqual(['expo']);
  });
});

// @ref src/utils/packageRunner.ts
// The last rung of the chain, which downloads the CLI. Which runner does that downloading is the
// caller's choice, and it used to be npm's regardless: `bunx @expo/agent-cli whoami` spawned `npm exec
// eas-cli` [observed — 2026-08-26]. The stub is a `bunx` rather than the real one, so the
// assertion is about the argv this CLI builds and no package is fetched.
describe('the runner that downloads a CLI this machine does not have', () => {
  /** The environment `bunx` gives a bin with a Node shebang [observed — bun 1.3.14, live]. */
  const BUN_AGENT = {
    npm_config_user_agent: 'bun/1.3.14 npm/? node/v24.3.0 darwin arm64',
    npm_execpath: '/opt/homebrew/Cellar/bun/1.3.14/bin/bun',
  };

  /** A directory with no CLI of its own, and a recording `bunx` on `PATH`. */
  async function setupWithStubBunxAsync(): Promise<{ dir: string; pathEnv: string }> {
    const dir = await setupBareDirAsync([]);
    const pathDir = path.join(dir, 'runner-bin');
    const script = path.join(dir, 'bunx-stub.js');
    await fs.promises.writeFile(script, stubScriptFor('eas'));
    await installStubBinAsync(pathDir, 'bunx', script);
    return { dir, pathEnv: [pathDir, isolatedEnv(dir).PATH].join(path.delimiter) };
  }

  it(`should hand the package to bunx when bun started this CLI`, async () => {
    const { dir, pathEnv } = await setupWithStubBunxAsync();

    const result = await executeAgentCliAsync(dir, ['whoami'], {
      env: { ...isolatedEnv(dir), ...BUN_AGENT, ...pathEnvVars(pathEnv) },
    });

    // The package spec and the command, in that order, on bun's runner rather than npm's.
    expect(readInvocations(dir).map((run) => run.args)).toEqual([['eas-cli@latest', 'whoami']]);
    // Named by the runner, not by the path it was found at.
    expect(result.stderr).toContain('Using the EAS CLI (bunx eas-cli@latest)');
  });

  it(`should leave an npm-started CLI on npx, even with bunx sitting on PATH`, async () => {
    const { dir, pathEnv } = await setupWithStubBunxAsync();

    const result = await executeAgentCliAsync(dir, ['whoami'], {
      // No bun user agent: this is the npm case, and the stub bunx must not be reached for it.
      env: { ...isolatedEnv(dir), ...pathEnvVars(pathEnv) },
      reject: false,
    });

    // The bunx stub records itself as `eas`; the npx stub records itself as `npx`. So "bunx was not
    // reached" is "nothing under that name ran", and the run that did happen was npm's exec.
    expect(readInvocations(dir).map((run) => run.bin)).toEqual(['npx']);
    expect(readInvocations(dir)[0]!.args).toEqual(['--yes', 'eas-cli@latest', 'whoami']);
    expect(result.stderr).toContain('Using the EAS CLI (npx --yes eas-cli@latest)');
  });
});
