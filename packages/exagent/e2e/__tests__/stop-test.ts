/* eslint-env jest */
// @ref llp/0005-runtime-loop-tools.rfc.md §Stopping the dev server
// @ref llp/0005-runtime-loop-tools.rfc.md §Stopping the app
//
// The two stop commands, through the published bin. What is worth pinning at this tier is what a
// unit test cannot see: `dev:stop` signals a **real process**, and the property that matters is
// that it signals the one the lock names and nothing else; `runtime:stop` runs a **real device
// tool**, and the property that matters is the exact argv it hands it.
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

import {
  executeExagentAsync,
  holdDevLockAsync,
  installStubBinAsync,
  setupFixtureAsync,
  startStubDevServerAsync,
  stubExpoEnv,
} from '../utils';

const SIMULATOR_UDID = 'E2E-SIM-0001';

const EXPO_GO_TARGET = {
  id: '1',
  appId: 'host.exp.Exponent',
  webSocketDebuggerUrl: 'ws://127.0.0.1:8081/inspector/debug?device=1&page=1',
};

/**
 * Install a stub `xcrun` that reports one booted simulator and records every invocation.
 *
 * `runningAppIds` is what `simctl terminate` will find something to terminate for. The default is
 * "anything", which keeps the argv assertions below about argv; a test that names the list gets
 * the real refusal instead — `simctl` exits non-zero with `found nothing to terminate` for an app
 * that was not running, and that is half of what tells a typo from an app that has already gone.
 */
async function installStubXcrunAsync(
  projectRoot: string,
  { runningAppIds }: { runningAppIds?: string[] } = {}
): Promise<() => string[][]> {
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
      `const running = ${JSON.stringify(runningAppIds ?? null)};`,
      `if (args[1] === 'terminate' && running && !running.includes(args[3])) {`,
      `  process.stderr.write('An error was encountered processing the command: found nothing to terminate');`,
      `  process.exit(4);`,
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

/**
 * A process that does nothing but stay alive and record the signal it was sent.
 *
 * `dev:stop` sends a real signal to a real pid, so the test needs a real process to receive one —
 * a mocked `process.kill` would prove nothing about the thing this command exists to do.
 */
async function startSignalRecorderAsync(
  projectRoot: string
): Promise<{ pid: number; signalled(): string | null; stop(): void }> {
  const logPath = path.join(projectRoot, '.signal.log');
  const scriptPath = path.join(projectRoot, 'signal-recorder.js');
  await fs.promises.writeFile(
    scriptPath,
    [
      `const fs = require('fs');`,
      `for (const signal of ['SIGTERM', 'SIGINT']) {`,
      `  process.on(signal, () => {`,
      `    fs.writeFileSync(${JSON.stringify(logPath)}, signal);`,
      `    process.exit(0);`,
      `  });`,
      `}`,
      `setInterval(() => {}, 1000);`,
    ].join('\n')
  );

  const { spawn } = require('node:child_process') as typeof import('node:child_process');
  const child = spawn(process.execPath, [scriptPath], { stdio: 'ignore' });
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    pid: child.pid!,
    signalled: () => (fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : null),
    stop: () => child.kill('SIGKILL'),
  };
}

describe('exagent dev:stop', () => {
  // The whole command in one assertion: the lock names a pid, that pid is signalled, and the
  // report says it stopped. No port was guessed at and no `lsof` was composed.
  it('signals the process the lock names', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const recorder = await startSignalRecorderAsync(projectRoot);
    // A port nothing listens on, so "the dev server has gone" is true the moment the lock does.
    const releaseLock = await holdDevLockAsync(projectRoot, {
      url: 'http://127.0.0.1:59999',
      port: 59999,
      pid: recorder.pid,
      startedAt: new Date().toISOString(),
      projectRoot,
    });

    try {
      // The lock has to stop answering for the wait to end, and this test holds it rather than a
      // dev server, so it is released the moment the signal has landed.
      setTimeout(() => releaseLock(), 500);
      const result = await executeExagentAsync(projectRoot, ['dev:stop', '--json'], {
        env: stubExpoEnv(projectRoot),
      });

      expect(result.exitCode).toBe(0);
      const report = JSON.parse(result.stdout);
      expect(report).toMatchObject({
        stopped: true,
        pid: recorder.pid,
        port: 59999,
        lockHeld: true,
        signal: 'SIGTERM',
        forced: false,
        reason: null,
      });
      expect(recorder.signalled()).toBe('SIGTERM');
    } finally {
      releaseLock();
      recorder.stop();
    }
  });

  it('prints one JSON object with a stable set of keys', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['dev:stop', '--json']);

    expect(Object.keys(JSON.parse(result.stdout)).sort()).toEqual([
      'detail',
      'followups',
      // Which of --force's two proofs a refusal failed on, null otherwise (F48-1).
      'forceRefusedBy',
      'forced',
      'lockHeld',
      'pid',
      'port',
      // The two facts the conclusion is drawn from, and in that order of authority: the process
      // this command signalled, and the port number it was using (F48-10, llp/0005 §A port number
      // is not one listener).
      'portStillAnswering',
      'processStillRunning',
      'reason',
      'signal',
      'stopped',
      'url',
      'waitedMs',
    ]);
  });

  // @ref llp/0010-agent-conventions.rfc.md §Exit codes — the end state the caller asked for is
  // the state it is already in, so a second run must not read as a failure.
  it('exits 0 when nothing was running', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['dev:stop', '--json']);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      stopped: false,
      pid: null,
      lockHeld: false,
      reason: 'not-running',
    });
  });

  // The one thing this command must not do by accident. A second project's dev server on the port
  // is the ordinary case, and it is reported rather than killed.
  it('reports a dev server it did not start, and leaves it running', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({ targets: [EXPO_GO_TARGET] });

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['dev:stop', '--port', String(stub.port), '--json'],
        { reject: false }
      );

      expect(result.exitCode).toBe(20);
      const report = JSON.parse(result.stdout);
      expect(report).toMatchObject({
        stopped: false,
        lockHeld: false,
        reason: 'foreign-dev-server',
      });
      expect(report.detail).toContain('no lock answers for it');
      // Still up, which is the assertion the whole case is about.
      expect((await fetch(`${stub.url}/status`)).ok).toBe(true);
    } finally {
      await stub.close();
    }
  });

  // @ref llp/0021-stop-and-readiness-honesty.rfc.md §`--port` names the target — friction run 7,
  // F60. This is the assertion the finding is about, and it needs a real lock and a real process:
  // `--port` named one port, the lock named another, and the lock won.
  it('leaves the lock alone when --port names a different port', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const recorder = await startSignalRecorderAsync(projectRoot);
    const releaseLock = await holdDevLockAsync(projectRoot, {
      url: 'http://127.0.0.1:59999',
      port: 59999,
      pid: recorder.pid,
      startedAt: new Date().toISOString(),
      projectRoot,
    });
    const stranger = await startStubDevServerAsync({ targets: [EXPO_GO_TARGET] });

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['dev:stop', '--port', String(stranger.port), '--json'],
        { env: stubExpoEnv(projectRoot), reject: false }
      );

      expect(result.exitCode).toBe(20);
      const report = JSON.parse(result.stdout);
      expect(report).toMatchObject({
        stopped: false,
        port: stranger.port,
        lockHeld: false,
        reason: 'foreign-dev-server',
      });
      // The lock's own dev server is named, so a mistyped port is recoverable, and it is untouched.
      expect(report.detail).toContain('59999');
      expect(recorder.signalled()).toBeNull();
      expect((await fetch(`${stranger.url}/status`)).ok).toBe(true);
    } finally {
      releaseLock();
      recorder.stop();
      await stranger.close();
    }
  });

  // @ref llp/0021-stop-and-readiness-honesty.rfc.md §`--port` names the target — friction run 7,
  // F72. "Nothing is listening" was reported about a port a plain TCP server was on.
  it('does not claim a busy port is quiet', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const server = net.createServer((socket) => socket.destroy());
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as net.AddressInfo).port;

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['dev:stop', '--port', String(port), '--json'],
        { reject: false }
      );

      expect(result.exitCode).toBe(20);
      const report = JSON.parse(result.stdout);
      expect(report).toMatchObject({ stopped: false, reason: 'foreign-dev-server' });
      expect(report.detail).toContain(`no Expo dev server answered on port ${port}`);
      expect(report.detail).not.toContain('nothing is listening');
      expect(server.listening).toBe(true);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it('refuses a bare port and names the flag that takes one', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['dev:stop', '8081', '--json'], {
      reject: false,
    });

    expect(result.exitCode).toBe(1);
    const { error } = JSON.parse(result.stdout);
    expect(error.code).toBe('BAD_ARGS');
    expect(error.message).toContain('--port 8081');
  });
});

describe('exagent runtime:stop', () => {
  it('terminates the connected app on the booted simulator', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const readXcrun = await installStubXcrunAsync(projectRoot);
    const stub = await startStubDevServerAsync({ targets: [EXPO_GO_TARGET] });

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:stop', '--ios', '--json', '--dev-server-url', stub.url],
        { env: stubExpoEnv(projectRoot) }
      );

      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({
        stopped: true,
        wasRunning: true,
        platform: 'ios',
        deviceId: SIMULATOR_UDID,
        bundleId: 'host.exp.Exponent',
        bundleIdSource: 'dev-server',
        reason: null,
      });
      expect(readXcrun()).toContainEqual([
        'simctl',
        'terminate',
        SIMULATOR_UDID,
        'host.exp.Exponent',
      ]);
    } finally {
      await stub.close();
    }
  });

  it('prints one JSON object with a stable set of keys', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    await installStubXcrunAsync(projectRoot);
    const stub = await startStubDevServerAsync({ targets: [EXPO_GO_TARGET] });

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:stop', '--ios', '--json', '--dev-server-url', stub.url],
        { env: stubExpoEnv(projectRoot) }
      );

      expect(Object.keys(JSON.parse(result.stdout)).sort()).toEqual([
        'appIdMismatch',
        'bundleId',
        'bundleIdReason',
        'bundleIdSource',
        'command',
        'connectedAppIds',
        'deviceBackend',
        'deviceId',
        'followups',
        'platform',
        'reason',
        'stopped',
        'wasRunning',
      ]);
    } finally {
      await stub.close();
    }
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §An `--app-id` nobody is running — friction run 4, F42.
  // `runtime:stop --app-id host.exp.Exponent2` used to exit 0 with `Stopped yes · it was not
  // running`, and the app the caller could see on the simulator kept running. This tier is where
  // the whole conjunction is real at once: a device tool that refuses, and a dev server that is
  // reporting some other app.
  it('exits 20 when --app-id names an app that is not the one connected', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const readXcrun = await installStubXcrunAsync(projectRoot, {
      runningAppIds: ['host.exp.Exponent'],
    });
    const stub = await startStubDevServerAsync({ targets: [EXPO_GO_TARGET] });

    try {
      const result = await executeExagentAsync(
        projectRoot,
        [
          'runtime:stop',
          '--ios',
          '--app-id',
          'host.exp.Exponent2',
          '--json',
          '--dev-server-url',
          stub.url,
        ],
        { env: stubExpoEnv(projectRoot), reject: false }
      );

      expect(result.exitCode).toBe(20);
      expect(JSON.parse(result.stdout)).toMatchObject({
        wasRunning: false,
        bundleId: 'host.exp.Exponent2',
        connectedAppIds: ['host.exp.Exponent'],
        appIdMismatch: true,
      });
      // The id the caller gave is the id that was tried: the flag is still obeyed, and the
      // disagreement is reported rather than silently corrected.
      expect(readXcrun()).toContainEqual([
        'simctl',
        'terminate',
        SIMULATOR_UDID,
        'host.exp.Exponent2',
      ]);
      expect(result.stderr).toContain('runtime:stop --app-id host.exp.Exponent');
    } finally {
      await stub.close();
    }
  });

  // Stopping an app twice must stay a success, which is what makes the command idempotent. With
  // nothing connected there is no second app for the id to disagree with.
  it('stays at 0 for a repeat stop with nothing connected', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    await installStubXcrunAsync(projectRoot, { runningAppIds: [] });
    const stub = await startStubDevServerAsync({ targets: [] });

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['runtime:stop', '--ios', '--json', '--dev-server-url', stub.url],
        { env: stubExpoEnv(projectRoot) }
      );

      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({
        stopped: true,
        wasRunning: false,
        appIdMismatch: false,
        connectedAppIds: [],
      });
    } finally {
      await stub.close();
    }
  });

  it('stops the id --app-id names', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const readXcrun = await installStubXcrunAsync(projectRoot);
    const stub = await startStubDevServerAsync({ targets: [EXPO_GO_TARGET] });

    try {
      await executeExagentAsync(
        projectRoot,
        ['runtime:stop', '--ios', '--app-id', 'com.example.other', '--dev-server-url', stub.url],
        { env: stubExpoEnv(projectRoot) }
      );

      expect(readXcrun()).toContainEqual([
        'simctl',
        'terminate',
        SIMULATOR_UDID,
        'com.example.other',
      ]);
    } finally {
      await stub.close();
    }
  });

  it('refuses a bare application id and names the flag that takes one', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(
      projectRoot,
      ['runtime:stop', 'com.example.demo', '--json'],
      { reject: false }
    );

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).error.message).toContain('--app-id com.example.demo');
  });

  it('advertises both stop commands in the top-level help', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['--help']);

    expect(result.all).toContain('runtime:stop');
    expect(result.all).toContain('dev:stop');
  });
});
