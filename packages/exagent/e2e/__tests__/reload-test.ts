/* eslint-env jest */
// @ref llp/0005-runtime-loop-tools.rfc.md §Reloading the app
//
// `exagent reload` speaks a protocol nobody promises: the dev server's client command socket, on
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
  method: 'dev-server' | 'device' | null;
  verifiedBy: 'message-socket-peers' | 'app-relaunch' | null;
  devServerUrl: string;
  devServerSource: string;
  appsConnected: number;
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

describe('exagent reload', () => {
  it('reloads over the dev server, and says what proved it', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({
      targets: [EXPO_GO_TARGET],
      messageSocket: 'v2',
    });
    const releaseLock = await lockToStubAsync(projectRoot, stub);
    const readXcrun = await installStubXcrunAsync(projectRoot);

    try {
      const result = await executeExagentAsync(projectRoot, ['reload', '--json'], {
        env: stubExpoEnv(projectRoot),
      });

      expect(result.exitCode).toBe(0);
      const report: ReloadReport = JSON.parse(result.stdout);
      expect(report.reloaded).toBe(true);
      expect(report.method).toBe('dev-server');
      expect(report.verifiedBy).toBe('message-socket-peers');
      expect(report.devServerSource).toBe('lock');
      expect(report.appsConnected).toBe(1);
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
      const result = await executeExagentAsync(projectRoot, ['reload', '--json'], {
        env: stubExpoEnv(projectRoot),
      });

      expect(Object.keys(JSON.parse(result.stdout)).sort()).toEqual([
        'appsConnected',
        'attempts',
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
        ['reload', '--method', 'dev-server', '--json'],
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
        ['reload', '--method', 'dev-server', '--json'],
        { env: stubExpoEnv(projectRoot), reject: false }
      );

      expect(result.exitCode).toBe(20);
      expect(JSON.parse(result.stdout).attempts[0]!.reason).toContain('did not act on it');
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
    });
    const releaseLock = await lockToStubAsync(projectRoot, stub);
    const readXcrun = await installStubXcrunAsync(projectRoot);

    try {
      const result = await executeExagentAsync(projectRoot, ['reload', '--ios', '--json'], {
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
      ['reload', '--dev-server-url', 'http://127.0.0.1:8199', '--json'],
      { env: stubExpoEnv(projectRoot), reject: false }
    );

    // A tool error, not an outcome: there was nothing to reload onto.
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).error.code).toBe('NO_DEV_SERVER');
  });

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules — rule (d).
  it('refuses a bare route and names the flag that takes one', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['reload', '/notes', '--json'], {
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
    expect(result.all).toContain('reload');
  });
});
