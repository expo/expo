/* eslint-env jest */
// @ref llp/0022-live-tier.plan.md §live-cloud: written, gated, and not yet run
//
// The cloud-simulator half of the live tier. **Implemented and not yet run** [2026-08-27, wave 20]:
// the staging cloud-session budget belongs to another wave while this is being written, and
// `runtime:reload --cloud`'s behaviour is changing under it. The matrix in
// llp/0019 marks these rows `planned (runnable)` rather than filled, and nothing in this file may be
// read as evidence until somebody has seen it green.
//
// Two things it is worth being explicit about, because they decide what this suite can ever assert:
//
//  - **A cloud simulator needs a tunnelled dev server.** `exp://127.0.0.1:<port>` names the loopback
//    of the machine that opens it, and that machine is in a datacenter. So this suite starts the dev
//    server with `--tunnel`, which needs `@expo/ngrok` — and that is a prerequisite gate, not a
//    failure, because a machine without it is a machine this suite cannot run on.
//  - **The runtime loop is unreachable on a cloud simulator today.** S11 [observed — staging-live,
//    2026-08-26]: the app runs and registers zero CDP targets over both the local and the tunnel URL.
//    So `navigate --cloud` can assert that the link was opened and must *not* assert `attached`, and
//    there is deliberately no `runtime:eval --cloud` test here — the flag does not exist, correctly.
//    The wall is upstream of this CLI; what this suite pins is that the CLI is honest about it.
//
// Cost, which is why this suite is opt-in twice over (`test:live:cloud`, plus
// `EXAGENT_LIVE_CLOUD=1`): an EAS Simulator session bills from `simulator:start` until
// `simulator:stop`. The session is started once, reused by every test, and stopped in `afterAll`
// whatever happened — and the cost line reports it.

import fs from 'node:fs';
import path from 'node:path';

import {
  allOf,
  builtBinGate,
  describeLive,
  networkGate,
  packageRunnerGate,
  stagingGate,
  type Gate,
} from '../prereq';
import {
  LIVE_PORT_BASE,
  LiveRun,
  execAsync,
  expectExit,
  parseJson,
  runLiveEasAsync,
  waitForAsync,
} from '../utils';

/**
 * The second opt-in, and the reason it exists.
 *
 * Every other suite in this tier is gated on prerequisites — facts about the machine. This one is
 * gated on an *intention*, because its prerequisites can all hold on a machine whose owner did not
 * mean to start a billing cloud session from a test run.
 */
function cloudOptInGate(): Gate {
  return process.env.EXAGENT_LIVE_CLOUD === '1'
    ? { ok: true }
    : {
        ok: false,
        reason:
          'EXAGENT_LIVE_CLOUD=1 is not set — an EAS Simulator session bills from start to stop, so this suite never runs without being asked for by name',
      };
}

/** `@expo/ngrok`, which a tunnel needs and which the Expo CLI will not install unprompted. */
function ngrokGate(): Gate {
  try {
    require.resolve('@expo/ngrok/package.json', {
      paths: [process.cwd(), require('node:os').homedir()],
    });
    return { ok: true };
  } catch {
    return {
      ok: false,
      reason:
        'a cloud simulator needs a tunnelled dev server and @expo/ngrok is not resolvable — install it globally ("npm i -g @expo/ngrok"), because the Expo CLI prompts for it and a non-interactive run cannot answer',
    };
  }
}

const staging = stagingGate();
const gate = allOf(
  builtBinGate(),
  cloudOptInGate(),
  staging.gate,
  packageRunnerGate(),
  networkGate(),
  ngrokGate()
);

/** The port the tunnelled dev server runs on, clear of `live-local`'s. */
const PORT = LIVE_PORT_BASE + 10;

/** Generous, because a cloud session start crosses a datacenter and a queue. */
const BOUND_MS = 300_000;

describeLive('live-cloud', gate)('live-cloud: an EAS Simulator session, on staging', () => {
  const run = new LiveRun('live-cloud');
  let projectRoot = '';
  let sessionId: string | null = null;

  beforeAll(async () => {
    // The same tiny fixture the deploy test uses, plus a scaffold's worth of nothing: what is under
    // test here is the session and the link, not the app.
    projectRoot = path.join(run.tempDir, 'cloudapp');
    const created = await runLiveEasAsync(
      run,
      run.tempDir,
      ['new', 'cloudapp', '--name', 'Cloud App', '--json'],
      {
        label: 'new',
      }
    );
    run.spend.scaffolds += 1;
    expectExit(created, 0);
    projectRoot = parseJson(created).projectRoot;

    // Stop first, delete second: the cleanup that costs money runs before the one that costs disk.
    run.onCleanup('scratch project', () => {
      if (!process.env.EXAGENT_LIVE_KEEP) {
        fs.rmSync(run.tempDir, { recursive: true, force: true });
      }
    });
    run.onCleanup('dev:stop', async () => {
      await runLiveEasAsync(run, projectRoot, ['dev:stop', '--json'], {
        label: 'cleanup-dev-stop',
      });
    });
    run.onCleanup('eas simulator:stop', async () => {
      // Unconditional, and it does not read `sessionId` first: the failure mode worth guarding is a
      // session that started and whose id this process never learned, and `simulator:stop` on
      // nothing is free.
      const stopped = await execAsync(
        'npx',
        ['--yes', 'eas-cli@latest', 'simulator:stop', '--non-interactive'],
        {
          cwd: projectRoot,
          env: { EXPO_STAGING: '1' },
          timeoutMs: 300_000,
        }
      );
      run.writeArtifact('cleanup-simulator-stop.txt', stopped.stdout + stopped.stderr);
    });

    // A tunnel, because a datacenter cannot reach this machine's loopback.
    const dev = await runLiveEasAsync(
      run,
      projectRoot,
      ['dev', '--detach', '--wait-ready', '--tunnel', '--port', String(PORT), '--json'],
      { label: 'dev-tunnel' }
    );
    expectExit(dev, 0);
    const devReport = parseJson(dev);
    // S3: `tunnelUrl` was null while the tunnel was up, which blocks every `--cloud` path without a
    // manual `--dev-server-url`. If it is still null, this suite cannot proceed and says why.
    if (!devReport.tunnelUrl) {
      throw new Error(
        'the dev server started with --tunnel but reported tunnelUrl: null, so no cloud simulator can ' +
          `reach it (S3). Evidence: ${dev.artifact}`
      );
    }

    const started = await execAsync(
      'npx',
      [
        '--yes',
        'eas-cli@latest',
        'simulator:start',
        '--platform',
        'ios',
        '--type',
        'agent-device',
        '--non-interactive',
        '--json',
      ],
      { cwd: projectRoot, env: { EXPO_STAGING: '1' }, timeoutMs: BOUND_MS }
    );
    run.writeArtifact('simulator-start.json', started.stdout + started.stderr);
    if (started.exitCode !== 0) {
      throw new Error(
        `eas simulator:start failed (exit ${started.exitCode}): ${started.stderr.slice(-2000)}`
      );
    }
    run.spend.cloudSessions += 1;
    sessionId = JSON.parse(started.stdout)?.id ?? null;
  });

  afterAll(async () => {
    await run.cleanUpAsync();
    console.log(run.costLine());
  });

  it('the session this suite started is the one the CLI finds', async () => {
    expect(sessionId).toBeTruthy();
    const envFile = path.join(projectRoot, '.env.eas-simulator');
    const found = await waitForAsync(() => fs.existsSync(envFile), 60_000);
    expect(found).toBe(true);
    expect(fs.readFileSync(envFile, 'utf8')).toContain(sessionId as string);
  });

  it('navigate --cloud opens the route on the cloud simulator', async () => {
    const result = await runLiveEasAsync(run, projectRoot, ['navigate', '/', '--cloud', '--json'], {
      label: 'navigate-cloud',
    });
    const report = parseJson(result);
    expect(report.deviceBackend).toBe('cloud-ios');
    // The link, and only the link. `attached` is not asserted: S11 says a cloud simulator registers
    // zero CDP targets, so the honest outcome today is exit 22 with `attached: false`, and a test
    // that demanded `attached: true` would be asserting a fix nobody has made.
    expect(report.url).toContain('exp://');
    expect(report.exitCode).toBe(0);
    expect([0, 22]).toContain(result.exitCode);
    if (result.exitCode === 22) {
      // S11, restated as an assertion: the refusal is honest, and it is about attaching rather than
      // about opening. When this stops being 22, the wall has moved and this test says so.
      expect(report.attached).toBe(false);
    }
  });

  it('smoke --cloud reports the phases it could reach, and stays on the backend it was given', async () => {
    const result = await runLiveEasAsync(run, projectRoot, ['smoke', '--cloud', '--json'], {
      label: 'smoke-cloud',
    });
    const report = parseJson(result);
    expect([0, 20, 22]).toContain(result.exitCode);
    expect(report.deviceBackend).toBe('cloud-ios');
    // llp/0019 bug 5: a cloud run that found nothing used to be answered with `--ios` follow-ups —
    // "this is what opens one on a booted device" — to a host that reached for the cloud precisely
    // because it has no booted device. Every follow-up of a `--cloud` run stays on `--cloud`.
    for (const followup of report.followups ?? []) {
      if (followup.command.includes('exagent')) {
        expect(followup.command).not.toMatch(/--ios\b|--android\b/);
      }
    }
  });

  it('runtime:reload --cloud is honest about what it reached', async () => {
    const result = await runLiveEasAsync(
      run,
      projectRoot,
      ['runtime:reload', '--cloud', '--json'],
      {
        label: 'reload-cloud',
      }
    );
    const report = parseJson(result);
    expect([0, 20]).toContain(result.exitCode);
    // Either the broadcast reached a client or it did not, and the report has to say which. Exit 20
    // with `reloaded: false` is the answer for a bundle that was served but never connected back
    // [observed — staging-live, 2026-08-26]; wave 19 is changing which of these is expected, so this
    // asserts the contract rather than the outcome.
    expect(typeof report.reloaded).toBe('boolean');
    if (result.exitCode === 0) {
      expect(report.reloaded).toBe(true);
    }
    // S12: a failed cloud reload used to close the controller session and leave the device unusable
    // without mentioning it. Whatever happened, a session must still be there afterwards.
    const listed = await execAsync(
      'npx',
      ['--yes', 'eas-cli@latest', 'simulator:list', '--non-interactive', '--json'],
      { cwd: projectRoot, env: { EXPO_STAGING: '1' }, timeoutMs: 120_000 }
    );
    run.writeArtifact('simulator-list-after-reload.json', listed.stdout + listed.stderr);
    expect(listed.stdout).toContain(sessionId as string);
  });

  it('runtime:stop --cloud ends the app without ending the session', async () => {
    const result = await runLiveEasAsync(run, projectRoot, ['runtime:stop', '--cloud', '--json'], {
      label: 'stop-cloud',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.deviceBackend).toBe('cloud-ios');
    // S13: the follow-up asserted "the app was not running" while `wasRunning` was null — which is
    // the one thing the cloud backend cannot know, because its verb succeeds for any app id. Null is
    // the honest value; a `false` here would be a claim.
    expect([true, null]).toContain(report.wasRunning);
  });

  it('a --cloud run against a platform the session is not is refused, not opened', async () => {
    const result = await runLiveEasAsync(
      run,
      projectRoot,
      ['navigate', '/', '--cloud', '--android', '--json'],
      {
        label: 'navigate-cloud-mismatch',
      }
    );
    // llp/0019 §What is still not tested — "a session has one platform" was the unasserted row.
    expect(result.exitCode).not.toBe(0);
    const report = parseJson(result);
    expect(JSON.stringify(report)).toMatch(/platform|android/i);
  });
});
