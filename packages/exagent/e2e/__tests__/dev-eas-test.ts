/* eslint-env jest */
// @ref llp/0015-backend-selection-and-config.rfc.md §Running an `eas` step
//
// `plan-test.ts` covers which plan each backend produces, and `dev-test.ts` covers what runs when
// the plan is the local one. This file is the other half of that pair: what actually runs when the
// plan chose the cloud. The two routes are the same command with different steps, so the questions
// are the same questions — the order of the invocations, the stop on a failing step, whether a
// build was recorded — asked of the CLI on the other side of the boundary.
//
// Nothing here reaches EAS. The `eas` on `PATH` is a stub bin that records every invocation, the
// same way the fixtures' `expo` bin does.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeExagentAsync,
  installStubBinAsync,
  installStubFingerprintAsync,
  readStubExpoInvocations,
  setupFixtureAsync,
} from '../utils';

/** Name of the file the stub `eas` bin appends one JSON line to per invocation. */
const STUB_EAS_LOG_NAME = 'stub-eas-invocations.jsonl';

/** The record `src/plan/lastBuild.ts` writes, relative to the project root. */
const LAST_BUILD_FILE = path.join('.expo', 'exagent-last-build.json');

/**
 * An `eas` bin standing in for the EAS CLI on the cloud route, recording every invocation.
 *
 * - STUB_EAS_BUILD_EXIT: exit code `eas build` returns (default 0)
 * - STUB_EAS_BUILD_STDERR: what `eas build` writes to stderr before exiting, which is where the
 *   EAS CLI puts the auth refusal and its prompt stops
 * - STUB_EAS_CONFIGURE_EXIT: exit code `eas build:configure` returns (default 0)
 */
const STUB_EAS = `#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
fs.appendFileSync(
  path.join(process.cwd(), ${JSON.stringify(STUB_EAS_LOG_NAME)}),
  JSON.stringify({ args, cwd: process.cwd(), ci: process.env.CI ?? null }) + '\\n'
);
if (args[0] === 'build:configure') {
  process.stdout.write('eas.json written\\n');
  process.exit(Number(process.env.STUB_EAS_CONFIGURE_EXIT || 0));
}
if (args[0] === 'build') {
  if (process.env.STUB_EAS_BUILD_STDERR) {
    process.stderr.write(process.env.STUB_EAS_BUILD_STDERR + '\\n');
  }
  process.stdout.write('Build finished\\n');
  process.exit(Number(process.env.STUB_EAS_BUILD_EXIT || 0));
}
if (args[0] === 'whoami') {
  process.stdout.write('e2e-user\\n');
  process.exit(0);
}
process.stderr.write('stub eas: unexpected command ' + args[0] + '\\n');
process.exit(1);
`;

/**
 * An `eas` that is not the EAS CLI: a wrapper that panics before it runs anything.
 *
 * This is the shape `src/utils/wrapperCrash.ts` exists for — a shim, a stale link or a binary from
 * another project sitting under the name — and the bytes it prints are not EAS output at all.
 */
const STUB_EAS_WRAPPER_CRASH = `#!/usr/bin/env node
'use strict';
process.stderr.write("thread 'main' panicked at src/main.rs:41:9:\\n");
process.stderr.write('called \`Option::unwrap()\` on a \`None\` value\\n');
process.stderr.write('Stack backtrace:\\n   0: rust_begin_unwind\\n');
process.exit(101);
`;

/** Copy a fixture and install every stub bin the cloud route may reach for. */
async function setupAsync(
  fixtureName = 'dev-client-app',
  { easScript = STUB_EAS }: { easScript?: string } = {}
): Promise<string> {
  const projectRoot = await setupFixtureAsync(fixtureName);
  await installStubFingerprintAsync(projectRoot);

  const binDir = path.join(projectRoot, '.stub-bin');
  await fs.promises.mkdir(binDir, { recursive: true });
  const easStub = path.join(binDir, 'eas-stub.js');
  await fs.promises.writeFile(easStub, easScript);
  // Both places `resolveEasCli` looks, so the resolver is exercised rather than one of its arms.
  for (const dir of [binDir, path.join(projectRoot, 'node_modules', '.bin')]) {
    await installStubBinAsync(dir, 'eas', easStub);
  }
  return projectRoot;
}

/** The arguments of every recorded stub `eas` invocation, in the order they happened. */
function easInvocationArgs(projectRoot: string): string[][] {
  const logPath = path.join(projectRoot, STUB_EAS_LOG_NAME);
  if (!fs.existsSync(logPath)) {
    return [];
  }
  return fs
    .readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => (JSON.parse(line) as { args: string[] }).args);
}

/** The arguments of every recorded stub `expo` invocation, in the order they happened. */
function expoInvocationArgs(projectRoot: string): string[][] {
  return readStubExpoInvocations(projectRoot).map((invocation) => invocation.args);
}

/** Read the last-build record, or null when the run wrote none. */
function readLastBuildRecord(projectRoot: string): Record<string, string> | null {
  const filePath = path.join(projectRoot, LAST_BUILD_FILE);
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : null;
}

/** Write the developer config into a copied fixture, at `package.json` › `expo` › `exagent`. */
async function writeExagentConfigAsync(projectRoot: string, config: unknown): Promise<void> {
  const file = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(await fs.promises.readFile(file, 'utf8'));
  packageJson.expo = { ...packageJson.expo, exagent: config };
  await fs.promises.writeFile(file, JSON.stringify(packageJson, null, 2));
}

describe('exagent dev — the EAS route', () => {
  // @ref llp/0015-backend-selection-and-config.rfc.md §What the EAS route is made of
  // Three steps, two CLIs, one order. `dev-test.ts` asserts the same property of the local route
  // (`prebuild` then `run:ios`), and the reason it has to be asserted separately here is that the
  // steps cross a *different* process boundary: nothing in the local route spawns `eas`.
  it('runs build:configure, then the cloud build, then the dev server', async () => {
    const projectRoot = await setupAsync();

    const result = await executeExagentAsync(projectRoot, ['dev', '--ios', '--eas']);

    expect(result.exitCode).toBe(0);
    expect(easInvocationArgs(projectRoot)).toEqual([
      ['build:configure'],
      ['build', '--platform', 'ios', '--profile', 'development'],
    ]);
    // The dev server is the `expo` step that follows, because `eas build` starts none. The
    // caller's `--ios` reaches it: the plan's last step *is* `expo start`, which owns that flag,
    // so unlike the local route it is appended rather than reported as an option that went
    // nowhere (`resolveStepArgs`).
    expect(expoInvocationArgs(projectRoot)).toEqual([['start', '--dev-client', '--ios']]);
  });

  // `eas build:configure` exists in the plan for exactly one reason: without an `eas.json` there is
  // no `development` profile for the build step to name. A project that has one does not get it.
  it('skips build:configure when the project already has an eas.json', async () => {
    const projectRoot = await setupAsync();
    await fs.promises.writeFile(
      path.join(projectRoot, 'eas.json'),
      JSON.stringify({ build: { development: { developmentClient: true } } }, null, 2)
    );

    const result = await executeExagentAsync(projectRoot, ['dev', '--ios', '--eas']);

    expect(result.exitCode).toBe(0);
    expect(easInvocationArgs(projectRoot)).toEqual([
      ['build', '--platform', 'ios', '--profile', 'development'],
    ]);
  });

  it('runs the android build for --android, and passes the platform through', async () => {
    const projectRoot = await setupAsync();

    const result = await executeExagentAsync(projectRoot, ['dev', '--android', '--eas']);

    expect(result.exitCode).toBe(0);
    expect(easInvocationArgs(projectRoot)).toContainEqual([
      'build',
      '--platform',
      'android',
      '--profile',
      'development',
    ]);
  });

  // @ref llp/0015-backend-selection-and-config.rfc.md §Installing is guidance
  // `recordBuildOf` ignores `eas` steps, because the record answers "does the app *installed on a
  // device* match this project" and a cloud build ends with an artifact nothing installed. The
  // local route's own assertion is in `dev-test.ts` ("records the built fingerprint").
  it('records no build for a cloud build, which nothing installed', async () => {
    const projectRoot = await setupAsync();

    const result = await executeExagentAsync(projectRoot, ['dev', '--ios', '--eas']);

    expect(result.exitCode).toBe(0);
    expect(readLastBuildRecord(projectRoot)).toBeNull();
  });

  it('stops at a failing cloud build, forwards its exit code, and names the EAS CLI', async () => {
    const projectRoot = await setupAsync();

    const result = await executeExagentAsync(projectRoot, ['dev', '--ios', '--eas'], {
      env: { STUB_EAS_BUILD_EXIT: '3' },
      reject: false,
    });

    expect(result.exitCode).toBe(3);
    // The exit code is the EAS CLI's own, and the sentence that says so has to name the right CLI.
    expect(result.all).toContain(`the EAS CLI's own`);
    expect(result.all).not.toContain(`the Expo CLI's own`);
    // The dev server step depends on the build, so nothing after it ran.
    expect(expoInvocationArgs(projectRoot)).toEqual([]);
  });

  it('stops at a failing build:configure without starting the build', async () => {
    const projectRoot = await setupAsync();

    const result = await executeExagentAsync(projectRoot, ['dev', '--ios', '--eas'], {
      env: { STUB_EAS_CONFIGURE_EXIT: '1' },
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(easInvocationArgs(projectRoot)).toEqual([['build:configure']]);
  });

  // @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol
  // The scenario llp/0015 names as the reason the classifier is told `tool: 'eas'`: "an `eas build`
  // that stopped for a login is a different scenario from an `expo start` that stopped for a
  // prompt". The code and the prose have to agree with that, because an agent reads both.
  it('exits 7 with the EAS login handoff when the cloud build cannot sign in', async () => {
    const projectRoot = await setupAsync();

    const result = await executeExagentAsync(projectRoot, ['dev', '--ios', '--eas', '--json'], {
      env: {
        STUB_EAS_BUILD_EXIT: '1',
        STUB_EAS_BUILD_STDERR:
          'Either log in with "eas login" or set the EXPO_TOKEN environment variable to authenticate.',
      },
      reject: false,
    });

    expect(result.exitCode).toBe(7);
    const report = JSON.parse(result.stdout);
    expect(report.error.needsHuman).toMatchObject({
      scenario: 'eas-login',
      command: 'npx eas login',
    });
    // The code is the scenario's, not the Expo CLI's prompt code: they are different stops with
    // different recoveries, and an agent that branches on the code has to be able to tell them
    // apart.
    expect(report.error.code).toBe('EAS_LOGIN_REQUIRED');
    // And the prose names the CLI that actually stopped.
    expect(report.error.message).toContain('EAS CLI');
    expect(report.error.message).not.toContain('the Expo CLI asks before');
  });

  it('exits 7 and names the EAS CLI when the cloud build asks a question', async () => {
    const projectRoot = await setupAsync();

    const result = await executeExagentAsync(projectRoot, ['dev', '--ios', '--eas', '--json'], {
      env: {
        STUB_EAS_BUILD_EXIT: '1',
        STUB_EAS_BUILD_STDERR: 'Input is required, but is in non-interactive mode.',
      },
      reject: false,
    });

    expect(result.exitCode).toBe(7);
    const report = JSON.parse(result.stdout);
    expect(report.error.needsHuman.scenario).toBe('eas-prompt');
    expect(report.error.code).toBe('EAS_NEEDS_INPUT');
    expect(report.error.message).toContain('EAS CLI');
  });

  // @ref llp/0015-backend-selection-and-config.rfc.md §Running an `eas` step — the *throwing*
  // resolver: a plan that chose the cloud cannot do its job without the CLI. Since wave 18 the
  // ladder's third rung downloads the published one, so reaching this failure takes a `PATH` with
  // no package runner on it either — which is what the empty `.stub-bin` below is.
  it('refuses the run when neither an eas binary nor a package runner exists', async () => {
    const projectRoot = await setupFixtureAsync('dev-client-app');
    await installStubFingerprintAsync(projectRoot);

    const result = await executeExagentAsync(projectRoot, ['dev', '--ios', '--eas', '--json'], {
      // An empty PATH addition is not enough: the machine's own `eas` would be found. The resolver
      // takes the `PATH` it is given, and the runner puts the project's `.stub-bin` first, so a
      // project with no `eas` in either place is the case under test only when `PATH` has none.
      env: { PATH: path.join(projectRoot, '.stub-bin') },
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(report.error.code).toBe('EAS_CLI_MISSING');
    expect(report.error.message).toContain('no package runner');
    expect(report.error.suggestedCommand).toBe('npm install --save-dev eas-cli');
  });

  // @ref llp/0001-agentic-cli-on-expo-cli.rfc.md §Constraints — the thing on the other side of the
  // spawn is whatever the machine has under that name. Quoting a wrapper's panic under "What the
  // tool printed" tells the reader the EAS CLI said it, and an agent then acts on that.
  it('names a binary that was never the EAS CLI rather than quoting its crash', async () => {
    const projectRoot = await setupAsync('dev-client-app', {
      easScript: STUB_EAS_WRAPPER_CRASH,
    });

    const result = await executeExagentAsync(projectRoot, ['dev', '--ios', '--eas', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(101);
    const report = JSON.parse(result.stdout);
    expect(report.error.message).toContain('may not be the real CLI');
    expect(report.error.message).not.toContain('rust_begin_unwind');
  });

  it('prints exactly one JSON object for a cloud run that succeeded', async () => {
    const projectRoot = await setupAsync();

    const result = await executeExagentAsync(projectRoot, ['dev', '--ios', '--eas', '--json']);

    expect(result.exitCode).toBe(0);
    // The report is the plan itself, exactly as the local route's own `--json` run prints it.
    const report = JSON.parse(result.stdout);
    // `runsOn` answers "where does this step build", so only the build step says `eas`:
    // `build:configure` writes a file on this machine and the dev server runs here too.
    expect(report.steps.map((step: { id: string; runsOn: string | null }) => [step.id, step.runsOn]))
      .toEqual([
        ['eas-configure', null],
        ['eas-build', 'eas'],
        ['start', null],
      ]);
    expect(report.buildLocation).toMatchObject({
      runsOn: 'eas',
      platform: 'ios',
      selection: { runsOn: 'eas', source: 'flag' },
    });
    expect(result.stdout).not.toContain('stub_expo_start');
  });

  // @ref llp/0015-backend-selection-and-config.rfc.md §The schema — the per-platform override
  // exists because the case is real: iOS in the cloud where the credentials live, Android on this
  // machine where the SDK is. `plan-test.ts` pins the plan; this pins the run that follows it.
  it('follows a per-platform config into the cloud for that platform only', async () => {
    const projectRoot = await setupAsync();
    await writeExagentConfigAsync(projectRoot, { ios: { buildBackend: 'eas' } });

    const result = await executeExagentAsync(projectRoot, ['dev', '--ios']);

    expect(result.exitCode).toBe(0);
    expect(easInvocationArgs(projectRoot)).toContainEqual([
      'build',
      '--platform',
      'ios',
      '--profile',
      'development',
    ]);
    // The local route's own build step is `expo run:ios`, and it is not what ran.
    expect(expoInvocationArgs(projectRoot)).toEqual([['start', '--dev-client', '--ios']]);
  });

  it('tells the cloud build it is CI, the way every captured step is told', async () => {
    const projectRoot = await setupAsync();

    await executeExagentAsync(projectRoot, ['dev', '--ios', '--eas', '--json']);

    const log = fs
      .readFileSync(path.join(projectRoot, STUB_EAS_LOG_NAME), 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { args: string[]; ci: string | null });
    expect(log.every((invocation) => invocation.ci === '1')).toBe(true);
  });
});
