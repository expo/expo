/* eslint-env jest */
// @ref llp/0005-runtime-loop-tools.rfc.md §The cloud simulator backend
//
// `exagent navigate --cloud` end to end, against a stub `eas` bin installed the way npm installs a
// real one. Nothing here touches EAS: no account, no session, no billing.
//
// This file exists because of what the unit tests **cannot** claim. The argv is pinned there, in
// `src/device/__tests__/cloudSimulator-test.ts`, and every one of those invocations is [inferred] —
// built from documented syntax and never run against a live service, because the machine this was
// written on is signed out. What is pinned *here* is the other half: that the argv the module
// builds is the argv a whole `exagent` process actually spawns, in order, with the session's
// platform on it — and that the three ways this fails without a session (none, signed out, a binary
// that is not the CLI) each produce their own exit code and their own sentence.

import fs from 'node:fs';
import path from 'node:path';

import {
  executeExagentAsync,
  installStubBinAsync,
  setupFixtureAsync,
  startStubDevServerAsync,
  type ExecuteResult,
} from '../utils';

/** Where the stub `eas` records what it was asked to do, one JSON line per run. */
const STUB_EAS_LOG_NAME = 'stub-eas-simulator-invocations.jsonl';

/**
 * Stub `eas` bin for the simulator surface.
 *
 * It answers the three questions the cloud backend asks — `simulator:get`, `simulator:availability`
 * and `simulator:exec` — and records every argv it was given, which is the assertion this file is
 * for. Steered per test with environment variables so one script covers every path:
 *
 * - STUB_SIM_STATUS: the session status `simulator:get --json` reports (default `IN_PROGRESS`)
 * - STUB_SIM_PLATFORM: the session's platform (default `ios`)
 * - STUB_SIM_GET_EXIT: exit code of `simulator:get`, for a CLI that refuses to answer
 * - STUB_SIM_STDERR: what it prints before a non-zero exit, so a test hands the wrapper the exact
 *   wording the real CLI uses
 * - STUB_SIM_AVAILABLE: `false` for an account without the feature
 * - STUB_SIM_EXEC_EXIT: exit code of `simulator:exec`, for a session that refuses the verb
 * - STUB_SIM_CRASH: `1` to behave like a wrapper that is not the EAS CLI at all — exit 101 with a
 *   Rust backtrace and nothing an `eas` run would ever print
 */
const STUB_EAS = `#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
fs.appendFileSync(
  path.join(process.cwd(), ${JSON.stringify(STUB_EAS_LOG_NAME)}),
  JSON.stringify({ args, cwd: process.cwd() }) + '\\n'
);

if (process.env.STUB_SIM_CRASH === '1') {
  // What a shim, a stale link, or a binary from another project looks like: a crash with no Expo
  // vocabulary anywhere in it (\`src/utils/wrapperCrash.ts\`).
  process.stderr.write('thread \\'main\\' panicked at src/main.rs:12:9\\nStack backtrace:\\n');
  process.exit(101);
}

if (args[0] === 'whoami') {
  process.stdout.write('e2e-account\\n');
  process.exit(0);
}

if (args[0] === 'simulator:availability') {
  process.stdout.write(JSON.stringify({ available: process.env.STUB_SIM_AVAILABLE !== 'false' }) + '\\n');
  process.exit(0);
}

if (args[0] === 'simulator:get') {
  const exitCode = Number(process.env.STUB_SIM_GET_EXIT || 0);
  if (exitCode !== 0) {
    process.stderr.write((process.env.STUB_SIM_STDERR || 'Session not found') + '\\n');
    process.exit(exitCode);
  }
  process.stdout.write(
    JSON.stringify({
      id: 'sess-e2e',
      status: process.env.STUB_SIM_STATUS || 'IN_PROGRESS',
      platform: process.env.STUB_SIM_PLATFORM || 'ios',
    }) + '\\n'
  );
  process.exit(0);
}

if (args[0] === 'simulator:exec') {
  const exitCode = Number(process.env.STUB_SIM_EXEC_EXIT || 0);
  if (exitCode !== 0) {
    process.stderr.write((process.env.STUB_SIM_STDERR || 'Remote daemon is unavailable') + '\\n');
    process.exit(exitCode);
  }
  process.stdout.write('opened\\n');
  process.exit(0);
}

process.stderr.write('stub eas: unhandled command ' + args.join(' ') + '\\n');
process.exit(1);
`;

/** Copy a fixture and put the stub `eas` where `PATH` and `node_modules/.bin` both find it. */
async function setupAsync(fixtureName: string): Promise<string> {
  const projectRoot = await setupFixtureAsync(fixtureName);
  const binDir = path.join(projectRoot, '.stub-bin');
  await fs.promises.mkdir(binDir, { recursive: true });
  const stubScript = path.join(binDir, 'eas-stub.js');
  await fs.promises.writeFile(stubScript, STUB_EAS);
  await installStubBinAsync(binDir, 'eas', stubScript);
  return await fs.promises.realpath(projectRoot);
}

/** Write the dotenv `eas-cli` manages, which is how a project names its session. */
async function writeSessionFileAsync(projectRoot: string, sessionId: string): Promise<void> {
  await fs.promises.writeFile(
    path.join(projectRoot, '.env.eas-simulator'),
    `# managed by eas-cli\nEAS_SIMULATOR_SESSION_ID=${sessionId}\nEAS_SIMULATOR_TOKEN=stub-token\n`
  );
}

/** Every argv the stub `eas` was given, in the order it was given them. */
function easInvocations(projectRoot: string): string[][] {
  const logPath = path.join(projectRoot, STUB_EAS_LOG_NAME);
  if (!fs.existsSync(logPath)) {
    return [];
  }
  return fs
    .readFileSync(logPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line).args);
}

/**
 * A `navigate --cloud` run that reaches the device without a dev server.
 *
 * `--scheme` is what makes that possible: it produces a development build's `<scheme>://<route>`,
 * which carries no host, so there is nothing for the tunnel check to refuse and no dev server to
 * find. `--no-wait-attach` is the other half — nothing is connected to wait for.
 */
function navigateCloud(
  projectRoot: string,
  extraArgs: string[] = [],
  env: Record<string, string> = {}
): Promise<ExecuteResult> {
  return executeExagentAsync(
    projectRoot,
    [
      'navigate',
      '/notes',
      '--cloud',
      '--scheme',
      'myapp',
      '--no-wait-attach',
      '--json',
      ...extraArgs,
    ],
    { env, reject: false }
  );
}

describe('exagent navigate --cloud', () => {
  it(`opens the link through simulator:exec, with the session's own platform`, async () => {
    const projectRoot = await setupAsync('go-app');
    await writeSessionFileAsync(projectRoot, 'sess-e2e');

    const result = await navigateCloud(projectRoot);

    expect(result.exitCode).toBe(0);

    // The whole point of this file: the argv a real process sent, in order. The session is asked
    // about first — by id, because the dotenv named one — and only then is the verb run.
    const invocations = easInvocations(projectRoot);
    expect(invocations[0]).toEqual(['simulator:get', '--id', 'sess-e2e', '--json']);
    expect(invocations[1]).toEqual([
      'simulator:exec',
      'npx',
      'agent-device@latest',
      'open',
      'myapp://notes',
      '--platform',
      'ios',
    ]);

    const report = JSON.parse(result.stdout);
    expect(report).toMatchObject({
      deviceBackend: 'cloud',
      platform: 'ios',
      deviceId: 'sess-e2e',
      url: 'myapp://notes',
    });
    expect(report.command).toContain('simulator:exec');
  });

  // A session is created for one platform and keeps it: the URL shape and the attach check both
  // differ, so the run follows the session rather than the host it is driven from.
  it(`follows the session's platform rather than this machine's default`, async () => {
    const projectRoot = await setupAsync('go-app');
    await writeSessionFileAsync(projectRoot, 'sess-e2e');

    const result = await navigateCloud(projectRoot, [], { STUB_SIM_PLATFORM: 'android' });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      deviceBackend: 'cloud',
      platform: 'android',
    });
    // No `adb` anywhere: the device is not on this machine, so nothing is forwarded onto it.
    expect(JSON.parse(result.stdout).reversedPort).toBeNull();
  });

  it(`says how to start a session when this project has none`, async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await navigateCloud(projectRoot);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No EAS Simulator session is running');
    expect(result.stderr).toContain('eas simulator:start --platform ios --type agent-device');
    // The read-only question, and nothing that could start or bill anything.
    expect(easInvocations(projectRoot)).toEqual([['simulator:availability', '--json']]);
  });

  it(`does not offer to start one on an account that cannot have it`, async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await navigateCloud(projectRoot, [], { STUB_SIM_AVAILABLE: 'false' });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('not enabled on this account');
    expect(result.stderr).not.toContain('simulator:start');
  });

  // Layer 3 of the needs-human protocol: signed out is a person's step, not a broken command, and
  // the exit code is the band an agent reads before it reads a word (llp/0010 §Exit codes).
  it(`exits 7 and names the login when nobody is signed in`, async () => {
    const projectRoot = await setupAsync('go-app');
    await writeSessionFileAsync(projectRoot, 'sess-e2e');

    const result = await navigateCloud(projectRoot, [], {
      STUB_SIM_GET_EXIT: '1',
      STUB_SIM_STDERR:
        'An Expo user account is required. Either log in with "eas login" or set the EXPO_TOKEN environment variable.',
    });

    expect(result.exitCode).toBe(7);
    expect(result.stderr).toContain('eas login');
    expect(result.stderr).toContain('EXPO_TOKEN');
  });

  // Quoting a Rust backtrace under "what the tool printed" claims the EAS CLI reported it, and a
  // reader then goes looking for a file the CLI never mentioned (`src/utils/wrapperCrash.ts`).
  it(`names the binary rather than quoting it when what ran was not the EAS CLI`, async () => {
    const projectRoot = await setupAsync('go-app');
    await writeSessionFileAsync(projectRoot, 'sess-e2e');

    const result = await navigateCloud(projectRoot, [], { STUB_SIM_CRASH: '1' });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('may not be the EAS CLI');
    expect(result.stderr).not.toContain('rust_begin_unwind');
    // Never "there is no session": a binary that did not run as the CLI established nothing, and
    // "start one" would start a second billed session next to one that may be up.
    expect(result.stderr).not.toContain('simulator:start');
  });

  it(`reports a session that has ended, without claiming there never was one`, async () => {
    const projectRoot = await setupAsync('go-app');
    await writeSessionFileAsync(projectRoot, 'sess-e2e');

    const result = await navigateCloud(projectRoot, [], { STUB_SIM_STATUS: 'FINISHED' });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('FINISHED');
    expect(result.stderr).toContain('eas simulator:start');
  });

  it(`explains a verb the session refused, and how to check the session`, async () => {
    const projectRoot = await setupAsync('go-app');
    await writeSessionFileAsync(projectRoot, 'sess-e2e');

    const result = await navigateCloud(projectRoot, [], { STUB_SIM_EXEC_EXIT: '1' });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Remote daemon is unavailable');
    expect(result.stderr).toContain('npx eas simulator:get --json');
  });

  // A cloud simulator is on EAS's network, so a loopback host in the link resolves to a machine in
  // a datacenter. Refused before anything opens, rather than opened onto an error screen.
  it(`refuses a dev server only this machine can reach`, async () => {
    const projectRoot = await setupAsync('go-app');
    await writeSessionFileAsync(projectRoot, 'sess-e2e');
    // A dev server that genuinely answers, on this machine's loopback: the refusal has to be about
    // where the dev server *is*, not about it being down, which is a different failure entirely.
    const devServer = await startStubDevServerAsync({ projectRoot });

    const result = await executeExagentAsync(
      projectRoot,
      ['navigate', '/', '--cloud', '--dev-server-url', devServer.url, '--no-wait-attach'],
      { reject: false }
    );
    await devServer.close();

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/tunnel|reachable from this machine/);
    // Nothing was opened: the check is before the verb, so no `simulator:exec` was ever spawned.
    expect(easInvocations(projectRoot).some((argv) => argv[0] === 'simulator:exec')).toBe(false);
  });
});

describe('exagent runtime:stop --cloud', () => {
  // `eas simulator:stop` ends the whole remote machine, which is a larger act than stopping one
  // app. The flag is accepted only so the command can say that instead of "unknown option".
  it(`refuses by name, and points at the two things it is not`, async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['runtime:stop', '--cloud'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('eas simulator:stop');
    expect(result.stderr).toContain('npx exagent navigate / --cloud');
    expect(easInvocations(projectRoot)).toEqual([]);
  });
});
