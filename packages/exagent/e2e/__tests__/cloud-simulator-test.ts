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
 * It answers the three questions the cloud backend asks — `simulator:list`,
 * `simulator:availability` and `simulator:exec` — and records every argv it was given, which is the
 * assertion this file is for. Steered per test with environment variables so one script covers
 * every path:
 *
 * - STUB_SIM_STATUS: the status of the listed session (default `IN_PROGRESS`)
 * - STUB_SIM_PLATFORM: the session's platform, as the raw enum (default `IOS`)
 * - STUB_SIM_TYPE: the session's controller type (default `agent-device`)
 * - STUB_SIM_SESSIONS: `0` for a project with nothing running
 * - STUB_SIM_GET_EXIT: exit code of `simulator:list`, for a CLI that refuses to answer
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
  const available = process.env.STUB_SIM_AVAILABLE !== 'false';
  process.stdout.write(
    JSON.stringify({
      available,
      accountName: 'e2e-account',
      ...(available ? {} : { waitlistUrl: 'https://expo.dev/services/simulators' }),
    }) + '\\n'
  );
  process.exit(0);
}

if (args[0] === 'simulator:list') {
  const exitCode = Number(process.env.STUB_SIM_GET_EXIT || 0);
  if (exitCode !== 0) {
    process.stderr.write((process.env.STUB_SIM_STDERR || 'Session not found') + '\\n');
    process.exit(exitCode);
  }
  const sessions =
    process.env.STUB_SIM_SESSIONS === '0'
      ? []
      : [
          {
            id: 'sess-e2e',
            name: 'e2e session',
            type: process.env.STUB_SIM_TYPE || 'agent-device',
            status: process.env.STUB_SIM_STATUS || 'IN_PROGRESS',
            platform: process.env.STUB_SIM_PLATFORM || 'IOS',
            createdAt: '2026-08-26T10:00:00.000Z',
          },
        ];
  process.stdout.write(JSON.stringify({ sessions, pageInfo: { hasNextPage: false } }) + '\\n');
  process.exit(0);
}

if (args[0] === 'simulator:exec') {
  const exitCode = Number(process.env.STUB_SIM_EXEC_EXIT || 0);
  if (exitCode !== 0) {
    process.stderr.write((process.env.STUB_SIM_STDERR || 'Remote daemon is unavailable') + '\\n');
    process.exit(exitCode);
  }
  // What the real controller answers a \`close\`, verbatim, whatever id it is given
  // [observed — live session 01a03d80, 2026-08-26]. It is the reason \`wasRunning\` is null on this
  // backend, so the stub has to say it rather than something more convenient.
  if (args.includes('close')) {
    process.stdout.write(
      JSON.stringify({ success: true, data: { session: 'default', message: 'Closed: default' } }) +
        '\\n'
    );
    process.exit(0);
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

    // The whole point of this file: the argv a real process sent, in order. What is running is
    // listed first, and only then is the verb run.
    const invocations = easInvocations(projectRoot);
    expect(invocations[0]).toEqual([
      'simulator:list',
      '--status',
      'in-progress',
      '--limit',
      '25',
      '--json',
    ]);
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

    const result = await navigateCloud(projectRoot, [], { STUB_SIM_PLATFORM: 'ANDROID' });

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

    const result = await navigateCloud(projectRoot, [], { STUB_SIM_SESSIONS: '0' });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('No EAS Simulator session this CLI can drive is running');
    expect(result.stderr).toContain('eas simulator:start --platform ios --type agent-device');
    // The listing, then the read-only availability question, and nothing that could start or bill
    // anything.
    expect(easInvocations(projectRoot)).toEqual([
      ['simulator:list', '--status', 'in-progress', '--limit', '25', '--json'],
      ['simulator:availability', '--json'],
    ]);
  });

  // The dotenv is no longer the gate: a session somebody else started — by MCP, or in another
  // terminal — is this project's session, and the service is what says so.
  it(`finds a session the service lists even with no dotenv on disk`, async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await navigateCloud(projectRoot);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      deviceBackend: 'cloud',
      deviceId: 'sess-e2e',
    });
  });

  // A running `serve-sim` session has no agent-device daemon in it. Saying "no session" would send
  // a reader to start a second billed one next to the one they are already paying for.
  it(`names the type when the only live session is one it cannot drive`, async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await navigateCloud(projectRoot, [], { STUB_SIM_TYPE: 'serve-sim' });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('serve-sim');
    expect(result.stderr).toContain('agent-device');
  });

  it(`does not offer to start one on an account that cannot have it`, async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await navigateCloud(projectRoot, [], {
      STUB_SIM_SESSIONS: '0',
      STUB_SIM_AVAILABLE: 'false',
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('not enabled on this account');
    expect(result.stderr).toContain('https://expo.dev/services/simulators');
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

    const result = await navigateCloud(projectRoot, [], { STUB_SIM_STATUS: 'STOPPED' });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('sess-e2e');
    expect(result.stderr).toContain('has ended');
    expect(result.stderr).toContain('eas simulator:start');
  });

  it(`explains a verb the session refused, and how to check the session`, async () => {
    const projectRoot = await setupAsync('go-app');
    await writeSessionFileAsync(projectRoot, 'sess-e2e');

    const result = await navigateCloud(projectRoot, [], { STUB_SIM_EXEC_EXIT: '1' });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Remote daemon is unavailable');
    expect(result.stderr).toContain('npx eas simulator:list --status in-progress');
  });

  // @ref llp/0005 §A non-zero exit means different things per backend. The controller's own
  // refusal, in the exact shape the first live run produced. Blaming the syntax here sends a reader
  // to check a command that was already correct.
  it(`says the device refused, not that the command was wrong, when the controller answered`, async () => {
    const projectRoot = await setupAsync('go-app');
    await writeSessionFileAsync(projectRoot, 'sess-e2e');

    const result = await navigateCloud(projectRoot, [], {
      STUB_SIM_EXEC_EXIT: '1',
      STUB_SIM_STDERR: 'Error (COMMAND_FAILED): Simulator device failed to open myapp://notes.',
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('The cloud simulator refused the command');
    expect(result.stderr).toContain('COMMAND_FAILED');
    expect(result.stderr).not.toContain('may not be the one the installed eas-cli has');
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
  // The controller's `close <app-id>` ends the named app and leaves the billed machine up. The
  // pinned argv is the point: `--shutdown` would tear down the session, and `simulator:stop` would
  // end it outright — neither of which is what this command was asked to do.
  it(`closes the named app on the session, and never the session itself`, async () => {
    const projectRoot = await setupAsync('go-app');
    await writeSessionFileAsync(projectRoot, 'sess-e2e');

    const result = await executeExagentAsync(
      projectRoot,
      ['runtime:stop', '--cloud', '--app-id', 'host.exp.Exponent', '--json', '--no-followups'],
      { reject: false }
    );

    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout);
    expect(report).toMatchObject({
      stopped: true,
      deviceBackend: 'cloud',
      deviceId: 'sess-e2e',
      bundleId: 'host.exp.Exponent',
      command: 'eas simulator:exec npx agent-device@latest close host.exp.Exponent',
    });
    // The live finding, held at the process boundary: `close` reports success for any id, so this
    // command must not claim the app it named had been running (llp/0005 §What `close` will not
    // tell you). Null, never true.
    expect(report.wasRunning).toBeNull();

    const invocations = easInvocations(projectRoot);
    expect(invocations[invocations.length - 1]).toEqual([
      'simulator:exec',
      'npx',
      'agent-device@latest',
      'close',
      'host.exp.Exponent',
    ]);
    expect(invocations.some((argv) => argv.includes('--shutdown'))).toBe(false);
    expect(invocations.some((argv) => argv[0] === 'simulator:stop')).toBe(false);
  });

  // `--cloud` is the only way a stop reaches a session: a machine with no local device is told it
  // has none rather than quietly handed a device that bills by the minute.
  it(`never reaches for a session that was not named`, async () => {
    const projectRoot = await setupAsync('go-app');
    await writeSessionFileAsync(projectRoot, 'sess-e2e');

    // Whether this machine has a booted simulator is not this test's business; that no `eas` was
    // ever spawned is.
    await executeExagentAsync(projectRoot, ['runtime:stop', '--ios'], { reject: false });

    expect(easInvocations(projectRoot)).toEqual([]);
  });

  it(`says how to start a session when --cloud finds none`, async () => {
    const projectRoot = await setupAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['runtime:stop', '--cloud'], {
      reject: false,
      env: { STUB_SIM_SESSIONS: '0' },
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('eas simulator:start');
    expect(easInvocations(projectRoot).some((argv) => argv[0] === 'simulator:exec')).toBe(false);
  });
});

// The two remaining `--cloud` commands. `navigate` and `runtime:stop` above had suites; these two
// take the same flag, walk the same ladder through `resolveDeviceAsync`, and had none — so the
// cloud half of `smoke` and of `runtime:reload` was reachable only by running it against a real
// billed session. What is asked here is the same three questions: which binary was spawned, with
// which argv, and what a run with no session is told.
describe('exagent smoke --cloud', () => {
  // The device-dependent phases go to the session rather than to this machine's tools. The local
  // half of this is `smoke-test.ts` ("hands xcrun simctl io the udid and the path"), and the two
  // have to be checked separately because they cross different process boundaries.
  it(`photographs the session through its controller, never the local simulator`, async () => {
    const projectRoot = await setupAsync('go-app');
    await writeSessionFileAsync(projectRoot, 'sess-e2e');
    // The stub has to name *this* project: a dev server serving another one makes `smoke` skip
    // every phase after `bundler-ready`, and the device phase is the one under test.
    const stub = await startStubDevServerAsync({ targets: [], projectRoot });
    try {
      await executeExagentAsync(
        projectRoot,
        ['smoke', '--cloud', '--dev-server-url', stub.url, '--json', '--timeout', '2s'],
        { reject: false }
      );

      const invocations = easInvocations(projectRoot);
      // The session was looked up: this is the cloud ladder rather than the local one.
      expect(invocations.some((argv) => argv[0] === 'simulator:list')).toBe(true);
    } finally {
      await stub.close();
    }
  });

  // A gate must not pass on a device it never found. `--cloud` is `required` for `smoke`'s device
  // phases, so an account with no session is told so rather than quietly falling back here.
  it(`reports the missing session rather than falling back to this machine`, async () => {
    const projectRoot = await setupAsync('go-app');
    const stub = await startStubDevServerAsync({ targets: [], projectRoot });
    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['smoke', '--cloud', '--dev-server-url', stub.url, '--json', '--timeout', '2s'],
        { reject: false, env: { STUB_SIM_SESSIONS: '0' } }
      );

      // Whatever the outcome code, the report is one parseable object and it never claims a pass.
      expect(result.exitCode).not.toBe(0);
      expect(() => JSON.parse(result.stdout)).not.toThrow();
      const report = JSON.parse(result.stdout);
      expect(report.ok).toBe(false);
      // The phase that could not run says which device it could not find.
      const app = report.phases.find((phase: { id: string }) => phase.id === 'app');
      expect(app.reason).toContain('EAS Simulator session');
      expect(report.deviceBackend).toBeNull();
      // And the ladder stays on the backend this run asked for: a suggestion that dropped
      // `--cloud` would send a host that reached for the cloud to a device it may not have.
      for (const followup of report.followups as { command: string }[]) {
        if (/exagent (smoke|navigate)\b/.test(followup.command)) {
          expect(followup.command).toContain('--cloud');
        }
      }
      // No verb was sent to a session that does not exist.
      expect(easInvocations(projectRoot).some((argv) => argv[0] === 'simulator:exec')).toBe(false);
    } finally {
      await stub.close();
    }
  });
});

describe('exagent runtime:reload --cloud', () => {
  // The device method of a reload: stop the app on the session's device and open it again. Without
  // `--cloud` this reaches a local device, and `runtime-reload-test.ts` covers that; with it, the
  // two verbs have to leave this process as `simulator:exec` calls on the session.
  it(`drives the session's controller when the dev server cannot reload`, async () => {
    const projectRoot = await setupAsync('go-app');
    await writeSessionFileAsync(projectRoot, 'sess-e2e');
    // `messageSocket: 'none'` is a dev server that refuses the client command socket, which is what
    // sends the reload down the device path instead.
    const stub = await startStubDevServerAsync({ targets: [], messageSocket: 'none' });
    try {
      const result = await executeExagentAsync(
        projectRoot,
        [
          'runtime:reload',
          '--cloud',
          '--dev-server-url',
          stub.url,
          '--timeout',
          '2s',
          '--json',
          '--no-followups',
        ],
        { reject: false }
      );

      const report = JSON.parse(result.stdout);
      // Every mechanism in order, and the device method is the one that ran: with no app connected
      // there is no command-socket client to broadcast to and no runtime to ask over the debugger,
      // which is the one case where a force-stop and a relaunch is also how an app gets *started*.
      expect(report.attempts.map((attempt: { method: string }) => attempt.method)).toEqual([
        'dev-server',
        'runtime',
        'device',
      ]);
      const runtimeAttempt = report.attempts[1];
      expect(runtimeAttempt.ok).toBe(false);
      expect(runtimeAttempt.reason).toContain('no app is connected');
      const invocations = easInvocations(projectRoot);
      expect(invocations.some((argv) => argv[0] === 'simulator:list')).toBe(true);
      // Never the session itself: a reload closes an app, and `--shutdown` would stop a machine
      // that bills by the minute and may not be this run's to stop.
      expect(invocations.some((argv) => argv.includes('--shutdown'))).toBe(false);
      expect(invocations.some((argv) => argv[0] === 'simulator:stop')).toBe(false);
    } finally {
      await stub.close();
    }
  });

  it(`says how to start a session when --cloud finds none`, async () => {
    const projectRoot = await setupAsync('go-app');
    const stub = await startStubDevServerAsync({ targets: [], messageSocket: 'none' });
    try {
      const result = await executeExagentAsync(
        projectRoot,
        [
          'runtime:reload',
          '--cloud',
          '--dev-server-url',
          stub.url,
          '--timeout',
          '2s',
          '--json',
          '--no-followups',
        ],
        { reject: false, env: { STUB_SIM_SESSIONS: '0' } }
      );

      // The one thing a reload must never do on a device it could not find: claim it reloaded.
      expect(result.exitCode).not.toBe(0);
      const report = JSON.parse(result.stdout);
      expect(report.reloaded).toBe(false);
      expect(report.method).toBeNull();
      const device = report.attempts.find(
        (attempt: { method: string }) => attempt.method === 'device'
      );
      expect(device.ok).toBe(false);
      expect(device.reason).toContain('EAS Simulator session');
      // And no verb was sent to a session that does not exist.
      expect(easInvocations(projectRoot).some((argv) => argv[0] === 'simulator:exec')).toBe(false);
    } finally {
      await stub.close();
    }
  });
});
