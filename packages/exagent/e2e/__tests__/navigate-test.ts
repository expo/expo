/* eslint-env jest */
// @ref llp/0005-runtime-loop-tools.rfc.md
//
// `exagent navigate` is the one runtime-facing command that *writes*: it drives a real device. A
// dev server resolved wrongly here does not produce a wrong reading, it loads another project's app
// onto the user's simulator and reports success — which is what happened while this command
// assumed 8081 instead of reading the project's dev-server lock.
//
// The device tools are stubbed on `PATH`, so no simulator is involved.
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

/** The shape `navigate --json` prints, per `src/navigate/navigateAsync.ts`. */
type NavigateReport = {
  route: string;
  url: string;
  devServerUrl: string;
  devServerSource: 'flag' | 'lock' | 'log' | 'default' | 'scan';
  resolution: string;
  target: string;
  platform: string;
  deviceId: string;
  appId: string | null;
  command: string;
  exitCode: number | null;
  followups: { id: string; command: string; why: string }[];
};

const SIMULATOR_UDID = 'E2E-SIM-0001';

/** A debugger target that looks like Expo Go, so the `exp://` URL shape is chosen. */
const EXPO_GO_TARGET = {
  id: '1',
  appId: 'host.exp.Exponent',
  webSocketDebuggerUrl: 'ws://127.0.0.1:8081/inspector/debug?device=1&page=1',
};

/**
 * Install a stub `xcrun` that answers `simctl list devices booted -j` with one booted simulator
 * and records every `simctl openurl` it is asked to perform.
 *
 * @returns a reader for the recorded invocations
 */
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

describe('exagent navigate', () => {
  it('documents that the dev server is discovered, not assumed to be 8081', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeExagentAsync(projectRoot, ['navigate', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.all).toContain('--dev-server-url');
    expect(result.all).toContain("the project's own, then 8081");
    // The old help promised 8081 as the default, which is the behaviour that was wrong.
    expect(result.all).not.toContain('(default: http://127.0.0.1:8081)');
  });

  // The regression: a lock naming a non-default port must decide the URL, exactly as it does for
  // `status`, `dev:wait` and the `runtime:*` actions.
  it('builds the URL from the dev-server lock rather than from 8081', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const readXcrun = await installStubXcrunAsync(projectRoot);
    const stub = await startStubDevServerAsync({ projectRoot, targets: [EXPO_GO_TARGET] });
    const releaseLock = await holdDevLockAsync(projectRoot, {
      url: stub.url,
      port: stub.port,
      pid: process.pid,
      startedAt: new Date().toISOString(),
      projectRoot,
    });

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['navigate', '/explore', '--ios', '--json'],
        { env: stubExpoEnv(projectRoot) }
      );

      expect(result.exitCode).toBe(0);
      const report: NavigateReport = JSON.parse(result.stdout);
      expect(report.devServerUrl).toBe(stub.url);
      expect(report.devServerSource).toBe('lock');
      expect(report.url).toBe(`exp://127.0.0.1:${stub.port}/--/explore`);

      // What the device was actually told, which is the fact the JSON only claims.
      expect(readXcrun()).toContainEqual([
        'simctl',
        'openurl',
        SIMULATOR_UDID,
        `exp://127.0.0.1:${stub.port}/--/explore`,
      ]);
    } finally {
      releaseLock();
      await stub.close();
    }
  });

  it('still uses --dev-server-url exactly as given', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    await installStubXcrunAsync(projectRoot);
    const stub = await startStubDevServerAsync({ projectRoot, targets: [EXPO_GO_TARGET] });

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['navigate', '/explore', '--ios', '--json', '--dev-server-url', stub.url],
        { env: stubExpoEnv(projectRoot) }
      );

      const report: NavigateReport = JSON.parse(result.stdout);
      expect(report.devServerSource).toBe('flag');
      expect(report.devServerUrl).toBe(stub.url);
    } finally {
      await stub.close();
    }
  });
});
