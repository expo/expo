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
  appsReconnected: number;
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
        'attempts',
        'bundle',
        'bundlePlatformSource',
        'bundlePlatforms',
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

  it('never force-stops an app the dev server can see, and says why it did not', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({
      // The app is connected and the command socket cannot see it, which is the K2 shape.
      targets: [CDP_TARGET],
      messagePeers: {},
    });
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
      expect(readXcrun()).toEqual([]);

      // The dev-server attempt says the two lists disagreed rather than that nothing is connected.
      const broadcast = report.attempts.find((attempt) => attempt.method === 'dev-server')!;
      expect(broadcast.ok).toBe(false);
      expect(broadcast.reason).toContain('1 connected app');
      expect(broadcast.reason).not.toBe(
        'no app is connected to the dev server, so there is nothing to reload'
      );

      // The device method is in the list, marked as not taken, with the reason — an attempt that
      // is simply absent is a decision a reader cannot see.
      const device = report.attempts.find((attempt) => attempt.method === 'device')!;
      expect(device.ok).toBe(false);
      expect(device.reason).toContain('--method device');
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
