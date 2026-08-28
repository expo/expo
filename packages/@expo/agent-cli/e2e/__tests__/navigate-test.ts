/* eslint-env jest */
// @ref llp/0005-runtime-loop-tools.rfc.md
//
// `@expo/agent-cli navigate` is the one runtime-facing command that *writes*: it drives a real device. A
// dev server resolved wrongly here does not produce a wrong reading, it loads another project's app
// onto the user's simulator and reports success — which is what happened while this command
// assumed 8081 instead of reading the project's dev-server lock.
//
// The device tools are stubbed on `PATH`, so no simulator is involved.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeAgentCliAsync,
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
  routeCheck: {
    checked: boolean;
    ok: boolean | null;
    matched: string | null;
    routeCount: number;
    reason: string | null;
  };
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

describe('@expo/agent-cli navigate', () => {
  it('documents that the dev server is discovered, not assumed to be 8081', async () => {
    const projectRoot = await setupFixtureAsync('go-app');

    const result = await executeAgentCliAsync(projectRoot, ['navigate', '--help']);

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
      const result = await executeAgentCliAsync(
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
      const result = await executeAgentCliAsync(
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

  // @ref llp/0005-runtime-loop-tools.rfc.md §Verifying the route. The friction this pins
  // [observed — friction run 3, F32]: `navigate /totally-bogus` exited 0 with the simulator on
  // Expo Router's "Unmatched Route" screen, and `runtime:errors --fail-on-error` and `dev:wait
  // --require-app` both exited 0 after it. Nothing that reads the *app* can see an unmatched
  // route, because the router renders a screen for it on purpose.
  describe('route check', () => {
    /** Give the fixture an Expo Router `app/` directory with the named route files. */
    async function writeRoutesAsync(projectRoot: string, files: string[]) {
      for (const file of files) {
        const target = path.join(projectRoot, 'app', file);
        await fs.promises.mkdir(path.dirname(target), { recursive: true });
        await fs.promises.writeFile(target, 'export default function Route() { return null; }\n');
      }
    }

    it('refuses a route the project has not got, and lists the ones it has', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const readXcrun = await installStubXcrunAsync(projectRoot);
      await writeRoutesAsync(projectRoot, ['index.tsx', 'explore.tsx', 'notes.tsx']);
      const stub = await startStubDevServerAsync({ projectRoot, targets: [EXPO_GO_TARGET] });

      try {
        const result = await executeAgentCliAsync(
          projectRoot,
          ['navigate', '/totally-bogus-route-xyz', '--ios', '--json', '--dev-server-url', stub.url],
          { env: stubExpoEnv(projectRoot), reject: false }
        );

        expect(result.exitCode).toBe(1);
        const { error } = JSON.parse(result.stdout);
        expect(error.code).toBe('ROUTE_NOT_FOUND');
        expect(error.message).toContain('/explore');
        expect(error.message).toContain('/notes');
        expect(error.message).toContain('--no-route-check');
        // Nothing reached the device: the point of the check is that the simulator never opens
        // onto the "Unmatched Route" screen in the first place.
        expect(readXcrun()).toEqual([]);
      } finally {
        await stub.close();
      }
    });

    it('names the nearest route as the command to run', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      await installStubXcrunAsync(projectRoot);
      await writeRoutesAsync(projectRoot, ['index.tsx', 'notes.tsx']);
      const stub = await startStubDevServerAsync({ projectRoot, targets: [EXPO_GO_TARGET] });

      try {
        const result = await executeAgentCliAsync(
          projectRoot,
          ['navigate', '/note', '--ios', '--json', '--dev-server-url', stub.url],
          { env: stubExpoEnv(projectRoot), reject: false }
        );

        expect(JSON.parse(result.stdout).error.suggestedCommand).toBe(
          'npx @expo/agent-cli navigate /notes'
        );
      } finally {
        await stub.close();
      }
    });

    it('matches a value against a dynamic route', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const readXcrun = await installStubXcrunAsync(projectRoot);
      await writeRoutesAsync(projectRoot, ['index.tsx', 'users/[id].tsx']);
      const stub = await startStubDevServerAsync({ projectRoot, targets: [EXPO_GO_TARGET] });

      try {
        const result = await executeAgentCliAsync(
          projectRoot,
          ['navigate', '/users/42', '--ios', '--json', '--dev-server-url', stub.url],
          { env: stubExpoEnv(projectRoot) }
        );

        expect(result.exitCode).toBe(0);
        const report = JSON.parse(result.stdout);
        expect(report.routeCheck).toEqual({
          checked: true,
          ok: true,
          matched: '/users/[id]',
          routeCount: 3,
          reason: null,
        });
        expect(readXcrun().some((call) => call[1] === 'openurl')).toBe(true);
      } finally {
        await stub.close();
      }
    });

    it('opens anything with --no-route-check', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const readXcrun = await installStubXcrunAsync(projectRoot);
      await writeRoutesAsync(projectRoot, ['index.tsx']);
      const stub = await startStubDevServerAsync({ projectRoot, targets: [EXPO_GO_TARGET] });

      try {
        const result = await executeAgentCliAsync(
          projectRoot,
          [
            'navigate',
            '/totally-bogus-route-xyz',
            '--ios',
            '--json',
            '--no-route-check',
            '--dev-server-url',
            stub.url,
          ],
          { env: stubExpoEnv(projectRoot) }
        );

        expect(result.exitCode).toBe(0);
        expect(JSON.parse(result.stdout).routeCheck.checked).toBe(false);
        expect(readXcrun().some((call) => call[1] === 'openurl')).toBe(true);
      } finally {
        await stub.close();
      }
    });

    // Fail open: a project with no router directory has not been shown to lack the route.
    it('opens the link when the project has no app directory', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      await installStubXcrunAsync(projectRoot);
      const stub = await startStubDevServerAsync({ projectRoot, targets: [EXPO_GO_TARGET] });

      try {
        const result = await executeAgentCliAsync(
          projectRoot,
          ['navigate', '/anything', '--ios', '--json', '--dev-server-url', stub.url],
          { env: stubExpoEnv(projectRoot) }
        );

        expect(result.exitCode).toBe(0);
        expect(JSON.parse(result.stdout).routeCheck).toMatchObject({ checked: false, ok: null });
      } finally {
        await stub.close();
      }
    });
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §The root route needs a query marker.
  it('addresses the root route with a URL Expo Go delivers', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const readXcrun = await installStubXcrunAsync(projectRoot);
    const stub = await startStubDevServerAsync({ projectRoot, targets: [EXPO_GO_TARGET] });

    try {
      const result = await executeAgentCliAsync(
        projectRoot,
        ['navigate', '/', '--ios', '--json', '--dev-server-url', stub.url],
        { env: stubExpoEnv(projectRoot) }
      );

      expect(result.exitCode).toBe(0);
      // Not `exp://127.0.0.1:<port>`, which expo-router's Expo Go link handler drops before the
      // router sees it, leaving a loaded app exactly where it was.
      expect(JSON.parse(result.stdout).url).toBe(`exp://127.0.0.1:${stub.port}/--/?`);
      expect(readXcrun()).toContainEqual([
        'simctl',
        'openurl',
        SIMULATOR_UDID,
        `exp://127.0.0.1:${stub.port}/--/?`,
      ]);
    } finally {
      await stub.close();
    }
  });

  // @ref llp/0021-honest-reports.rfc.md §The plan has to carry the forwarded flags — **F142.**
  // The step the acceptance walk stalled on: the dev server it had asked for had died, so
  // `navigate / --ios` could not build an Expo Go URL — and the one line it was handed to recover
  // with was `npx @expo/agent-cli dev --detach`, with the `--ios` dropped. Following it would have started a
  // dev server for whichever platform the plan engine picks, which is not what was asked for.
  it('keeps the platform the caller named on the line it recovers with', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    await installStubXcrunAsync(projectRoot);

    const result = await executeAgentCliAsync(
      projectRoot,
      // No dev server anywhere: no lock, no log, and a named URL nothing answers on.
      ['navigate', '/', '--ios', '--dev-server-url', 'http://127.0.0.1:1', '--json'],
      { env: stubExpoEnv(projectRoot), reject: false }
    );

    expect(result.exitCode).not.toBe(0);
    const { error } = JSON.parse(result.stdout);
    expect(error.suggestedCommand).toContain('--ios');
    // The `Try:` line is what an agent acts on, so the flag has to be on the stream too.
    expect(result.stderr).toContain('--ios');
  });
});
