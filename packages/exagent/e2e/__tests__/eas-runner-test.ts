/* eslint-env jest */
// @ref llp/0015-backend-selection-and-config.rfc.md §Resolving the EAS CLI
//
// The rung wave 18 added, end to end: a machine that never installed `eas-cli` still gets an answer
// out of EAS, because the resolver falls through to the published package. Kudo's report is the
// scenario — `eas unknown (no EAS CLI is installed, so nothing here can ask EAS about builds)` on a
// box with no `eas` [observed — 2026-08-26] — and the thing under test is that the reason is gone
// rather than merely reworded: the runner has to be *spawned*, with the package name and `--yes`
// ahead of the `eas` command word.
//
// Every test here runs on a `PATH` this file builds, because the machine running the suite may have
// a real `eas` — and would then exercise a rung above the one under test.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  executeExagentAsync,
  installStubBinAsync,
  installStubFingerprintAsync,
  setupFixtureAsync,
} from '../utils';

/**
 * A stub package runner: records the argv it was handed, then answers as the EAS CLI would.
 *
 * One script for `npx` and for `bunx`, because what is being pinned is the same either way — which
 * runner ran, and with what before the `eas` command word. It answers `build:list` with an empty
 * array (the shape that means "EAS has no such build") and `whoami` with a name, which is all the
 * two commands under test ask for.
 */
function stubRunnerScript(logFile: string): string {
  return `#!/usr/bin/env node
'use strict';
const args = process.argv.slice(2);
require('node:fs').appendFileSync(
  ${JSON.stringify(logFile)},
  JSON.stringify({ args }) + '\\n'
);
// Everything up to the eas command word is the runner's own: the flags and the package name.
const command = args.find((arg) => !arg.startsWith('-') && !arg.startsWith('eas-cli'));
if (command === 'build:list') {
  process.stdout.write('[]\\n');
} else if (command === 'whoami') {
  process.stdout.write('e2e-user\\n');
} else if (command === 'fingerprint:compare') {
  process.stdout.write('{}\\n');
} else {
  process.stdout.write('eas-cli/22.6.0 darwin-arm64 node-v26.5.0\\n');
}
`;
}

/** An `eas` that is not the EAS CLI: a wrapper that panics before it runs anything. */
const STUB_EAS_WRAPPER_CRASH = `#!/usr/bin/env node
'use strict';
process.stderr.write("thread 'main' panicked at src/main.rs:41:9:\\n");
process.stderr.write('called \`Option::unwrap()\` on a \`None\` value\\n');
process.stderr.write('Stack backtrace:\\n   0: rust_begin_unwind\\n');
process.exit(101);
`;

/** The per-platform `fingerprint` the EAS build lookup needs before it can ask about a hash. */
const STUB_FINGERPRINT = `#!/usr/bin/env node
'use strict';
const args = process.argv.slice(2);
const platform = args.includes('--platform') ? args[args.indexOf('--platform') + 1] : null;
const hash = platform === 'ios'
  ? 'aaaa1111bbbb2222cccc3333dddd4444eeee5555'
  : platform === 'android'
    ? 'ffff6666eeee7777dddd8888cccc9999bbbb0000'
    : '0f1e2d3c4b5a69788796a5b4c3d2e1f001234567';
process.stdout.write(JSON.stringify({ hash, sources: [] }) + '\\n');
`;

interface Planted {
  projectRoot: string;
  /** The only directory on the `PATH` the command runs with, besides Node's own. */
  binDir: string;
  logFile: string;
}

/**
 * A project with no `eas` anywhere, and a stub runner on `PATH` under the given names.
 *
 * `node_modules/.bin` gets the fingerprint bin and nothing else: the point is a project that never
 * installed `eas-cli`, which is the state the resolver's third rung exists for.
 */
async function plantAsync({
  runners,
  lockfile,
  brokenEasOnPath = false,
}: {
  runners: string[];
  lockfile?: string;
  brokenEasOnPath?: boolean;
}): Promise<Planted> {
  const projectRoot = await setupFixtureAsync('dev-client-fresh-app');
  await installStubFingerprintAsync(projectRoot);

  const binDir = path.join(projectRoot, '.stub-bin');
  const logFile = path.join(projectRoot, 'runner-invocations.jsonl');

  const runnerStub = path.join(projectRoot, 'runner-stub.js');
  await fs.promises.writeFile(runnerStub, stubRunnerScript(logFile));
  for (const runner of runners) {
    await installStubBinAsync(binDir, runner, runnerStub);
  }

  const fingerprintStub = path.join(projectRoot, 'fingerprint-stub.js');
  await fs.promises.writeFile(fingerprintStub, STUB_FINGERPRINT);
  await installStubBinAsync(binDir, 'fingerprint', fingerprintStub);
  await installStubBinAsync(path.join(projectRoot, 'node_modules', '.bin'), 'fingerprint', fingerprintStub);

  if (brokenEasOnPath) {
    const easStub = path.join(projectRoot, 'eas-wrapper-crash-stub.js');
    await fs.promises.writeFile(easStub, STUB_EAS_WRAPPER_CRASH);
    await installStubBinAsync(binDir, 'eas', easStub);
  }

  if (lockfile) {
    await fs.promises.writeFile(path.join(projectRoot, lockfile), '');
  }

  return { projectRoot, binDir, logFile };
}

/**
 * The `PATH` one of these commands runs with: the stub bin, and Node's own directory so the shims
 * can start a `node`. Nothing else, so the machine's own `eas` cannot answer.
 */
function pathEnv(binDir: string): Record<string, string> {
  return { PATH: [binDir, path.dirname(process.execPath), '/usr/bin', '/bin'].join(path.delimiter) };
}

function invocations({ logFile }: Planted): { args: string[] }[] {
  if (!fs.existsSync(logFile)) {
    return [];
  }
  return fs
    .readFileSync(logFile, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { args: string[] });
}

describe('a machine with no eas-cli installed', () => {
  it('asks EAS about builds through npx --yes eas-cli@latest', async () => {
    const planted = await plantAsync({ runners: ['npx'] });

    const result = await executeExagentAsync(
      planted.projectRoot,
      ['status', '--explain', '--json'],
      { env: pathEnv(planted.binDir) }
    );

    expect(result.exitCode).toBe(0);
    const lookups = invocations(planted).filter((run) => run.args.includes('build:list'));
    expect(lookups.length).toBeGreaterThan(0);
    // `--yes` first, because npx prompts before installing a package it has not seen and this CLI
    // never attaches stdin; then the package; then the EAS command word.
    expect(lookups[0]!.args.slice(0, 3)).toEqual(['--yes', 'eas-cli@latest', 'build:list']);

    const report = JSON.parse(result.stdout);
    // The answer Kudo could not get. `none` is EAS saying there is no such build, which is a fact —
    // where `unknown` was this CLI saying nobody could ask.
    expect(report.builds.platforms.map((platform: { state: string }) => platform.state)).toEqual([
      'none',
      'none',
    ]);
    for (const platform of report.builds.platforms) {
      expect(platform.reason).not.toContain('no EAS CLI is installed');
    }
  });

  it('uses bunx in a project whose lockfile is bun\'s', async () => {
    const planted = await plantAsync({ runners: ['npx', 'bunx'], lockfile: 'bun.lock' });

    await executeExagentAsync(planted.projectRoot, ['status', '--explain', '--json'], {
      env: pathEnv(planted.binDir),
    });

    const lookups = invocations(planted).filter((run) => run.args.includes('build:list'));
    expect(lookups.length).toBeGreaterThan(0);
    // No `--yes`: bunx installs what it is asked for without asking, and has no such flag.
    expect(lookups[0]!.args.slice(0, 2)).toEqual(['eas-cli@latest', 'build:list']);
  });

  it('keeps npx in a project whose lockfile is npm\'s, even when bunx is reachable', async () => {
    const planted = await plantAsync({
      runners: ['npx', 'bunx'],
      lockfile: 'package-lock.json',
    });

    await executeExagentAsync(planted.projectRoot, ['status', '--explain', '--json'], {
      env: pathEnv(planted.binDir),
    });

    const lookups = invocations(planted).filter((run) => run.args.includes('build:list'));
    expect(lookups[0]!.args.slice(0, 3)).toEqual(['--yes', 'eas-cli@latest', 'build:list']);
  });

  // @ref src/utils/easCli.ts §resolveEasCliAsync
  // The composition wave 17 left per call site: a broken shim under the name `eas` is skipped, and
  // what it falls through to is simply the rung below it — which is now the runner for every
  // EAS-backed command rather than for the auth chain alone.
  it('skips a broken shim on PATH and reaches the runner instead', async () => {
    const directory = await fs.promises.realpath(
      await fs.promises.mkdtemp(path.join(os.tmpdir(), 'exagent-eas-runner-'))
    );
    const binDir = path.join(directory, 'path-bin');
    const logFile = path.join(directory, 'runner-invocations.jsonl');

    const easStub = path.join(directory, 'eas-wrapper-crash-stub.js');
    await fs.promises.writeFile(easStub, STUB_EAS_WRAPPER_CRASH);
    await installStubBinAsync(binDir, 'eas', easStub);

    const runnerStub = path.join(directory, 'runner-stub.js');
    await fs.promises.writeFile(runnerStub, stubRunnerScript(logFile));
    await installStubBinAsync(binDir, 'npx', runnerStub);

    const result = await executeExagentAsync(directory, ['whoami'], {
      env: pathEnv(binDir),
      reject: false,
    });

    expect(result.exitCode).toBe(0);
    const runs = invocations({ projectRoot: directory, binDir, logFile });
    expect(runs[0]!.args).toEqual(['--yes', 'eas-cli@latest', 'whoami']);
    expect(result.all).not.toContain('rust_begin_unwind');
  });

  // The failure that is left. It is no longer "you have not installed eas-cli" — the resolver would
  // have downloaded it — so it names the missing runner, and never advises a command the reader
  // cannot run either.
  it('refuses a cloud build only when no runner is on PATH either, and says so', async () => {
    const projectRoot = await setupFixtureAsync('dev-client-app');
    await installStubFingerprintAsync(projectRoot);

    const result = await executeExagentAsync(projectRoot, ['dev', '--ios', '--eas', '--json'], {
      // A `PATH` with neither an `eas` nor a runner on it. The fixture's own `.stub-bin` has no
      // `npx`, so this is the one machine shape where the ladder runs out.
      env: { PATH: path.join(projectRoot, '.stub-bin') },
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(report.error.code).toBe('EAS_CLI_MISSING');
    expect(report.error.message).toContain('no package runner');
    expect(report.error.message).not.toContain('npm install -g eas-cli');
    expect(report.error.suggestedCommand).toBe('npm install --save-dev eas-cli');
  });
});
