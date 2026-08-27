/* eslint-env jest */
// @ref llp/0005-runtime-loop-tools.rfc.md §Reloading the app
//
// `exagent runtime:reload` speaks a protocol nobody promises: the dev server's client command socket, on
// `/message`, where every frame has to carry `version: 2` and a frame without it is dropped with
// no answer at all. A unit test can only check what this CLI sends; these run the published bin
// against a socket that answers the way the dev server answers, so the version stamp and the
// `getpeers` round trip are pinned at the process boundary they actually cross.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeExagentAsync,
  holdDevLockAsync,
  installStubBinAsync,
  setupFixtureAsync,
  startStubDevServerAsync,
  stubExpoEnv,
} from '../utils';

/** The shape `reload --json` prints, per `src/reload/reloadAsync.ts`. */
type ReloadReport = {
  reloaded: boolean;
  method: 'dev-server' | 'runtime' | 'device' | null;
  verifiedBy: 'message-socket-peers' | 'fresh-debugger-target' | 'app-relaunch' | null;
  devServerUrl: string;
  devServerSource: string;
  appsConnected: number;
  commandSocketChurn: {
    observed: boolean | null;
    before: number | null;
    after: number | null;
    reconnected: number;
    reason: string | null;
  };
  appsReconnected: number;
  appsReconnectedReason: string | null;
  bundlesAfterReload: { observed: boolean | null; count: number; line: string | null };
  bundle: {
    checked: boolean;
    ok: boolean | null;
    platform: string | null;
    url: string | null;
    error: { type: string | null; filename: string | null; lineNumber: number | null } | null;
    reason: string | null;
  };
  route: string | null;
  routeCheck: { checked: boolean; ok: boolean | null; matched: string | null };
  url: string | null;
  platform: string | null;
  deviceId: string | null;
  attempts: { method: string; ok: boolean; reason: string }[];
  waitedMs: number;
  followups: { id: string; command: string; why: string }[];
};

const SIMULATOR_UDID = 'E2E-SIM-0001';

const EXPO_GO_TARGET = {
  id: '1',
  appId: 'host.exp.Exponent',
  webSocketDebuggerUrl: 'ws://127.0.0.1:8081/inspector/debug?device=1&page=1',
};

/** Where the stub `xcrun` records that it opened the app, so the stub dev server can see it. */
function appStartedMarkerPath(projectRoot: string): string {
  return path.join(projectRoot, '.stub-app-started');
}

/** Install a stub `xcrun` that reports one booted simulator and records every invocation. */
async function installStubXcrunAsync(projectRoot: string): Promise<() => string[][]> {
  const logPath = path.join(projectRoot, '.stub-xcrun.jsonl');
  const scriptPath = path.join(projectRoot, '.stub-bin', 'xcrun-stub.js');
  await fs.promises.mkdir(path.dirname(scriptPath), { recursive: true });
  await fs.promises.writeFile(
    scriptPath,
    [
      `const fs = require('fs');`,
      `const args = process.argv.slice(2);`,
      `fs.appendFileSync(${JSON.stringify(logPath)}, JSON.stringify(args) + '\\n');`,
      `if (args[1] === 'list') {`,
      `  process.stdout.write(JSON.stringify({ devices: { 'com.apple.CoreSimulator.SimRuntime.iOS-26-0': [{ udid: ${JSON.stringify(SIMULATOR_UDID)}, name: 'iPhone 17 Pro', state: 'Booted' }] } }));`,
      `}`,
      // An app that was opened is an app that can register a JavaScript runtime, and one that was
      // terminated cannot. The stub dev server reads this to decide what `/json/list` reports.
      `if (args[1] === 'openurl') {`,
      `  fs.writeFileSync(${JSON.stringify(appStartedMarkerPath(projectRoot))}, '');`,
      `}`,
      `if (args[1] === 'terminate') {`,
      `  try { fs.unlinkSync(${JSON.stringify(appStartedMarkerPath(projectRoot))}); } catch {}`,
      `}`,
      `process.exit(0);`,
    ].join('\n')
  );
  await installStubBinAsync(path.join(projectRoot, '.stub-bin'), 'xcrun', scriptPath);

  return () =>
    fs.existsSync(logPath)
      ? fs
          .readFileSync(logPath, 'utf8')
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line))
      : [];
}

/** A stub `xcrun` that reports no booted device, for the runs where no rung may act. */
async function writeNoDeviceXcrunAsync(projectRoot: string): Promise<string> {
  const scriptPath = path.join(projectRoot, '.stub-bin', 'xcrun-empty.js');
  await fs.promises.mkdir(path.dirname(scriptPath), { recursive: true });
  await fs.promises.writeFile(
    scriptPath,
    [
      `if (process.argv[3] === 'list') {`,
      `  process.stdout.write(JSON.stringify({ devices: {} }));`,
      `}`,
      `process.exit(0);`,
    ].join('\n')
  );
  return scriptPath;
}

/** Point the project's dev-server lock at a stub, so discovery finds it without a port scan. */
async function lockToStubAsync(projectRoot: string, stub: { url: string; port: number }) {
  return await holdDevLockAsync(projectRoot, {
    url: stub.url,
    port: stub.port,
    pid: process.pid,
    startedAt: new Date().toISOString(),
    projectRoot,
  });
}

describe('exagent runtime:reload', () => {
  it('reloads over the dev server, and says what proved it', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      messageSocket: 'v2',
    });
    const releaseLock = await lockToStubAsync(projectRoot, stub);
    const readXcrun = await installStubXcrunAsync(projectRoot);

    try {
      const result = await executeExagentAsync(projectRoot, ['runtime:reload', '--json'], {
        env: stubExpoEnv(projectRoot),
      });

      expect(result.exitCode).toBe(0);
      const report: ReloadReport = JSON.parse(result.stdout);
      expect(report.reloaded).toBe(true);
      expect(report.method).toBe('dev-server');
      expect(report.verifiedBy).toBe('message-socket-peers');
      expect(report.devServerSource).toBe('lock');
      expect(report.appsConnected).toBe(1);
      // The number success is decided on: a target the dev server had not listed before.
      expect(report.appsReconnected).toBe(1);
      // Nothing was asked of a device, which is the whole advantage of this method.
      expect(readXcrun()).toEqual([]);
    } finally {
      releaseLock();
      await stub.close();
    }
  });

  it('prints one JSON object with a stable set of keys', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({ targets: [EXPO_GO_TARGET] });
    const releaseLock = await lockToStubAsync(projectRoot, stub);

    try {
      const result = await executeExagentAsync(projectRoot, ['runtime:reload', '--json'], {
        env: stubExpoEnv(projectRoot),
      });

      expect(Object.keys(JSON.parse(result.stdout)).sort()).toEqual([
        'appsConnected',
        'appsReconnected',
        // F95: a zero on the count above is three different facts, and this is which one.
        'appsReconnectedReason',
        'attempts',
        'bundle',
        'bundlePlatformSource',
        'bundlePlatforms',
        'bundlesAfterReload',
        // F95: the evidence `verifiedBy: 'message-socket-peers'` rests on. Without it the label was
        // checked against `appsReconnected`, which belongs to a different signal.
        'commandSocketChurn',
        'commandSocketClients',
        'devServerSource',
        'devServerUrl',
        'deviceId',
        'followups',
        'method',
        'platform',
        'reloaded',
        'route',
        'routeCheck',
        'url',
        'verifiedBy',
        'waitedMs',
      ]);
    } finally {
      releaseLock();
      await stub.close();
    }
  });

  // The silent failure the protocol makes possible, and the reason `getpeers` is asked first: a
  // dev server that does not speak this version drops the broadcast without an error, so a
  // command that sent one and reported success would be inventing a reload.
  it('reports no reload when the dev server never answers on the command socket', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      messageSocket: 'deaf',
    });
    const releaseLock = await lockToStubAsync(projectRoot, stub);

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:reload', '--method', 'dev-server', '--json'],
        { env: stubExpoEnv(projectRoot), reject: false }
      );

      // @ref llp/0010-agent-conventions.rfc.md §Exit codes — the tool worked, the operation failed.
      expect(result.exitCode).toBe(20);
      const report: ReloadReport = JSON.parse(result.stdout);
      expect(report.reloaded).toBe(false);
      expect(report.attempts[0]!.reason).toContain('protocol version');
    } finally {
      releaseLock();
      await stub.close();
    }
  });

  it('reports no reload when nothing reconnected after the broadcast', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      messageSocket: 'no-churn',
    });
    const releaseLock = await lockToStubAsync(projectRoot, stub);

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:reload', '--method', 'dev-server', '--json'],
        { env: stubExpoEnv(projectRoot), reject: false }
      );

      expect(result.exitCode).toBe(20);
      expect(JSON.parse(result.stdout).attempts[0]!.reason).toContain('did not act on it');
    } finally {
      releaseLock();
      await stub.close();
    }
  });

  // @ref llp/0010-agent-conventions.rfc.md §The reload gate — friction run 4, F38.
  // The check runs against the dev server, so this is the tier that can prove the two requests it
  // makes and, more importantly, that the broadcast never goes out.
  it('refuses to reload onto an entry bundle that does not compile', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({ targets: [EXPO_GO_TARGET], bundle: 'broken' });
    const releaseLock = await lockToStubAsync(projectRoot, stub);
    const readXcrun = await installStubXcrunAsync(projectRoot);

    try {
      const result = await executeExagentAsync(projectRoot, ['runtime:reload', '--json'], {
        env: stubExpoEnv(projectRoot),
        reject: false,
      });

      expect(result.exitCode).toBe(20);
      const report: ReloadReport = JSON.parse(result.stdout);
      expect(report.reloaded).toBe(false);
      expect(report.method).toBe(null);
      expect(report.bundle).toMatchObject({
        checked: true,
        ok: false,
        error: { type: 'TransformError', filename: 'src/app/index.tsx', lineNumber: 101 },
      });
      // Nothing was reloaded and no device was touched: the gate is before the broadcast.
      expect(report.attempts).toEqual([]);
      expect(readXcrun()).toEqual([]);
      expect(result.stderr).toContain('does not compile');
    } finally {
      releaseLock();
      await stub.close();
    }
  });

  it('reloads onto a broken bundle when --no-bundle-check says to', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({ targets: [EXPO_GO_TARGET], bundle: 'broken' });
    const releaseLock = await lockToStubAsync(projectRoot, stub);

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:reload', '--no-bundle-check', '--json'],
        { env: stubExpoEnv(projectRoot) }
      );

      expect(result.exitCode).toBe(0);
      const report: ReloadReport = JSON.parse(result.stdout);
      expect(report.reloaded).toBe(true);
      expect(report.bundle).toMatchObject({ checked: false, ok: null });
    } finally {
      releaseLock();
      await stub.close();
    }
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §What proves a reload — friction run 4, F45.
  // Peer churn proves the app acted on the broadcast. It does not prove the app came back, and
  // this is the case where it did not: the two facts have to be read separately or the command
  // reports success for an app that is gone.
  it('exits 22 when the app acted on the reload and did not come back', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      reloadTargets: 'gone',
    });
    const releaseLock = await lockToStubAsync(projectRoot, stub);

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:reload', '--method', 'dev-server', '--timeout', '1s', '--json'],
        { env: stubExpoEnv(projectRoot), reject: false }
      );

      expect(result.exitCode).toBe(22);
      const report: ReloadReport = JSON.parse(result.stdout);
      expect(report.reloaded).toBe(true);
      expect(report.appsConnected).toBe(0);
      expect(report.appsReconnected).toBe(0);
    } finally {
      releaseLock();
      await stub.close();
    }
  });

  // F95 — MAJOR, found by the live tier on 2026-08-27. `verifiedBy: 'message-socket-peers'` sat
  // beside `appsReconnected: 0`, which is a label reconciled against a *different* signal's count:
  // the peer churn's own count was not in the payload at all. The rule (llp/0021 §An observed signal,
  // or the band): a label may name only a signal whose evidence is here and non-empty.
  //
  // Run against every reload mode the stub has, because "the happy path is consistent" is the claim
  // that was true before the fix as well.
  describe('the verification payload is consistent, whatever the app does', () => {
    it.each([['reconnect'], ['stale'], ['gone']] as const)(
      'reloadTargets %s',
      async (reloadTargets) => {
        const projectRoot = await setupFixtureAsync('go-app');
        const stub = await startStubDevServerAsync({ targets: [EXPO_GO_TARGET], reloadTargets });
        const releaseLock = await lockToStubAsync(projectRoot, stub);

        try {
          const result = await executeExagentAsync(
            projectRoot,
            ['runtime:reload', '--method', 'dev-server', '--timeout', '2s', '--json'],
            { env: stubExpoEnv(projectRoot), reject: false }
          );

          const report = JSON.parse(result.stdout);
          // `reloaded` is exactly "a label was earned", so the two can never disagree.
          expect(report.reloaded).toBe(report.verifiedBy != null);
          const evidence: Record<string, number> = {
            'message-socket-peers': report.commandSocketChurn.reconnected,
            'fresh-debugger-target': report.appsReconnected,
            'dev-server-bundle': report.bundlesAfterReload.count,
            'app-relaunch': report.attempts.filter(
              (attempt: { method: string; ok: boolean }) => attempt.method === 'device' && attempt.ok
            ).length,
          };
          if (report.verifiedBy != null) {
            expect(evidence[report.verifiedBy]).toBeGreaterThan(0);
          }
          // A zero is never a bare number: it says which of the three facts it is.
          if (report.appsReconnected === 0) {
            expect(report.appsReconnectedReason).toBeTruthy();
          } else {
            expect(report.appsReconnectedReason).toBeNull();
          }
        } finally {
          releaseLock();
          await stub.close();
        }
      }
    );

    it('carries the churn count behind the label the happy path prints', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const stub = await startStubDevServerAsync({ targets: [EXPO_GO_TARGET] });
      const releaseLock = await lockToStubAsync(projectRoot, stub);

      try {
        const result = await executeExagentAsync(projectRoot, ['runtime:reload', '--json'], {
          env: stubExpoEnv(projectRoot),
        });

        expect(result.exitCode).toBe(0);
        const report = JSON.parse(result.stdout);
        expect(report.verifiedBy).toBe('message-socket-peers');
        // The count the label rests on, from a socket that really did replace its client id.
        expect(report.commandSocketChurn).toMatchObject({ observed: true, reconnected: 1 });
        expect(report.commandSocketChurn.reason).toBeNull();
      } finally {
        releaseLock();
        await stub.close();
      }
    });
  });

  // Friction run 4, F39: the target that is listed is the runtime the reload was meant to replace.
  // Reporting it as a connected app is what made the printed `runtime:errors` follow-up flaky.
  it('exits 22 when the listed target is the one from before the reload', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      reloadTargets: 'stale',
    });
    const releaseLock = await lockToStubAsync(projectRoot, stub);

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:reload', '--method', 'dev-server', '--timeout', '1s', '--json'],
        { env: stubExpoEnv(projectRoot), reject: false }
      );

      expect(result.exitCode).toBe(22);
      const report: ReloadReport = JSON.parse(result.stdout);
      expect(report.appsConnected).toBe(1);
      expect(report.appsReconnected).toBe(0);
      expect(result.stderr).toContain('the same debugger target');
    } finally {
      releaseLock();
      await stub.close();
    }
  });

  it('falls back to stopping the app on the device when no app is connected', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      messagePeers: {},
      // Nothing is connected until the stub `xcrun` has opened the app, which is what "no app is
      // connected" means on both channels at once: no peer on the command socket and no runtime in
      // the target list. The target that appears afterwards is therefore one this run produced.
      targetsAppearWithFile: appStartedMarkerPath(projectRoot),
    });
    const releaseLock = await lockToStubAsync(projectRoot, stub);
    const readXcrun = await installStubXcrunAsync(projectRoot);

    try {
      const result = await executeExagentAsync(projectRoot, ['runtime:reload', '--ios', '--json'], {
        env: stubExpoEnv(projectRoot),
      });

      expect(result.exitCode).toBe(0);
      const report: ReloadReport = JSON.parse(result.stdout);
      expect(report.method).toBe('device');
      expect(report.verifiedBy).toBe('app-relaunch');
      const calls = readXcrun();
      expect(calls).toContainEqual(['simctl', 'terminate', SIMULATOR_UDID, 'host.exp.Exponent']);
      expect(calls.some((call) => call[1] === 'openurl')).toBe(true);
    } finally {
      releaseLock();
      await stub.close();
    }
  });

  it('refuses to reload onto a dev server that is not there', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(
      projectRoot,
      ['runtime:reload', '--dev-server-url', 'http://127.0.0.1:8199', '--json'],
      { env: stubExpoEnv(projectRoot), reject: false }
    );

    // A tool error, not an outcome: there was nothing to reload onto.
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).error.code).toBe('NO_DEV_SERVER');
  });

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules — rule (d).
  it('refuses a bare route and names the flag that takes one', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['runtime:reload', '/notes', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    const { error } = JSON.parse(result.stdout);
    expect(error.code).toBe('BAD_ARGS');
    expect(error.message).toContain('--route /notes');
  });

  it('advertises the command in the top-level help', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('runtime:reload');
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §Two lists, one question — Kudo's cloud loop, K2.
//
// Two connection lists describe one app, and this command read the wrong one. `getpeers` on the
// dev server's command socket names the clients that speak *that* protocol; `/json/list` names the
// JavaScript runtimes that have a debugger — which is the list `status`, `runtime:eval` and `smoke`
// all use. Against a cloud app the first was empty and the second had the app in it, so
// `runtime:reload` printed "Apps connected 1 · no reload happened", then said "no app is connected
// to the dev server, so there is nothing to reload", then went looking for a booted simulator that
// this machine did not have — while `runtime:eval` was evaluating in that same app.
describe('an app the command socket cannot see', () => {
  /**
   * The same app, listed the way a dev server lists one a debugger can reach.
   *
   * `nativePageReloads` is what the target selector filters on, so a target without it is one no
   * CDP command can pick — which is right for the tests above and wrong for these.
   */
  const CDP_TARGET = {
    ...EXPO_GO_TARGET,
    title: 'React Native Experimental (Improved Chrome Reloads)',
    description: 'host.exp.Exponent',
    deviceName: 'iPhone 17 Pro',
    reactNative: { capabilities: { nativePageReloads: true }, logicalDeviceId: 'device-1' },
  };

  /** The reload the runtime method sends, which is the only expression this stub answers. */
  function reloadResponder(): (expression: string) => unknown {
    return (expression) => {
      if (!expression.includes('reloadAppAsync')) {
        return undefined;
      }
      // The probe carries its own diagnostic strings; the call does not.
      return expression.includes('no-expo-global') ? 'ready' : 'sent';
    };
  }

  it('reloads the app the debugger target list names, when --method runtime asks', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({
      // The app is connected: this is the list every other reading command in this CLI uses.
      targets: [CDP_TARGET],
      // And it is invisible on the command socket, which is what a cloud app over a tunnel was.
      messagePeers: {},
      inspectorEvaluate: reloadResponder(),
      reloadTargets: 'reconnect',
    });
    const releaseLock = await lockToStubAsync(projectRoot, stub);
    const readXcrun = await installStubXcrunAsync(projectRoot);

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:reload', '--method', 'runtime', '--json'],
        { env: stubExpoEnv(projectRoot) }
      );

      expect(result.exitCode).toBe(0);
      const report: ReloadReport = JSON.parse(result.stdout);
      expect(report.reloaded).toBe(true);
      expect(report.method).toBe('runtime');
      expect(report.verifiedBy).toBe('fresh-debugger-target');
      expect(report.appsReconnected).toBeGreaterThan(0);
      // And nothing went near a simulator.
      expect(readXcrun()).toEqual([]);
    } finally {
      releaseLock();
      await stub.close();
    }
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §One ladder, chosen by the command socket — wave 21.
  //
  // The K2 shape at the process boundary: the app is in `/json/list` and holds no client on the
  // command socket. `auto` used to refuse here and exit 20 with two methods to pick between; the
  // ladder now takes the rung that can reach the app, which is the relaunch — the same rung wave 19
  // made primary on a cloud session for the same reason.
  it('relaunches the app when the command socket has no client to broadcast to', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({
      targets: [CDP_TARGET],
      messagePeers: {},
    });
    const releaseLock = await lockToStubAsync(projectRoot, stub);
    const readXcrun = await installStubXcrunAsync(projectRoot);

    try {
      const result = await executeExagentAsync(
        projectRoot,
        // A short wait, because this run cannot end early: neither observation is available, so it
        // spends the whole budget establishing that. The default 30s is the same wait live.
        ['runtime:reload', '--ios', '--timeout', '2s', '--json'],
        { env: stubExpoEnv(projectRoot), reject: false }
      );

      // 22, and honestly so: this stub relists the app under the page id it had before, which is
      // what a relaunched app does [observed — 2026-08-27, live on a cloud session: `…ce-1` before
      // the relaunch and `…ce-1` after it]. So there is no *fresh* target to be had, and this
      // project has no captured dev server log to read a `Bundled` line out of — the run reports
      // the mechanism it ran and says nothing was observed, which is "look again" and never a
      // success off a verb that accepted an argument.
      expect(result.exitCode).toBe(22);
      const report: ReloadReport = JSON.parse(result.stdout);
      expect(report.method).toBe('device');

      // The dev-server rung says the two lists disagreed rather than that nothing is connected.
      const broadcast = report.attempts.find((attempt) => attempt.method === 'dev-server')!;
      expect(broadcast.ok).toBe(false);
      expect(broadcast.reason).toContain('1 connected app');
      expect(broadcast.reason).not.toBe(
        'no app is connected to the dev server, so there is nothing to reload'
      );

      // The relaunch ran on the local device backend, and the attempt says what it cost.
      const device = report.attempts.find((attempt) => attempt.method === 'device')!;
      expect(device.ok).toBe(true);
      expect(device.reason).toContain(`the app's JavaScript state`);
      expect(readXcrun()).toContainEqual([
        'simctl',
        'terminate',
        SIMULATOR_UDID,
        'host.exp.Exponent',
      ]);
    } finally {
      releaseLock();
      await stub.close();
    }
  });

  // ...and with no device to relaunch on, the same state is exit 20 with the two deliberate
  // methods, which is what the ladder has left to offer.
  it('exits 20 and names the deliberate methods when no rung can reach the app', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({ targets: [CDP_TARGET], messagePeers: {} });
    const releaseLock = await lockToStubAsync(projectRoot, stub);
    // A stub `xcrun` that reports nothing booted, so the relaunch rung has no device.
    await installStubBinAsync(
      path.join(projectRoot, '.stub-bin'),
      'xcrun',
      await writeNoDeviceXcrunAsync(projectRoot)
    );

    try {
      const result = await executeExagentAsync(projectRoot, ['runtime:reload', '--ios', '--json'], {
        env: stubExpoEnv(projectRoot),
        reject: false,
      });

      expect(result.exitCode).toBe(20);
      expect(JSON.parse(result.stdout).reloaded).toBe(false);
      // Both deliberate methods are on stderr, with what each one costs.
      expect(result.stderr).toContain('--method device');
      expect(result.stderr).toContain('--method runtime');
    } finally {
      releaseLock();
      await stub.close();
    }
  });

  it('takes --method runtime on its own', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({
      targets: [CDP_TARGET],
      messagePeers: {},
      inspectorEvaluate: reloadResponder(),
      reloadTargets: 'reconnect',
    });
    const releaseLock = await lockToStubAsync(projectRoot, stub);

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:reload', '--method', 'runtime', '--json'],
        { env: stubExpoEnv(projectRoot) }
      );

      const report: ReloadReport = JSON.parse(result.stdout);
      expect(report.method).toBe('runtime');
      // Only the one method was tried, because the caller pinned it.
      expect(report.attempts.map((attempt) => attempt.method)).toEqual(['runtime']);
    } finally {
      releaseLock();
      await stub.close();
    }
  });
});
