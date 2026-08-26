/* eslint-env jest */
// @ref llp/0005-runtime-loop-tools.rfc.md §The smoke gate
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
//
// What this tier owns, and what it does not.
//
// The **outcome table** is the unit tests' (`src/smoke/__tests__/phases-test.ts`), because it is a
// pure function of eight answers and pinning it needs no processes. What only a run through the
// published bin can show is the process boundary itself: that the exit codes leave the process,
// that `--json` is one parseable object, that a bogus route reaches the device tool **zero** times,
// and — the one thing no mock can prove — that a PNG written to a real pipe by `adb exec-out`
// arrives on disk as the same bytes.
//
// No simulator is involved: the device tools are stubs on `PATH`, and the dev server is the stub
// HTTP one every other runtime test uses.
import fs from 'node:fs';
import path from 'node:path';

import {
  executeExagentAsync,
  holdDevLockAsync,
  installStubBinAsync,
  setupFixtureAsync,
  startStubDevServerAsync,
  stubExpoEnv,
  type StubDevServer,
} from '../utils';

const SIMULATOR_UDID = 'E2E-SIM-SMOKE';

/** A debugger target that looks like Expo Go, so the `exp://` URL shape is chosen. */
const EXPO_GO_TARGET = {
  id: '1',
  appId: 'host.exp.Exponent',
  webSocketDebuggerUrl: 'ws://127.0.0.1:8081/inspector/debug?device=1&page=1',
};

/** The eight bytes every PNG starts with, as a JS string escape the stub can write. */
const PNG_HEADER_ESCAPE = '\\x89PNG\\r\\n\\x1a\\n';

/**
 * Install a stub `xcrun` that lists one booted simulator, records every invocation, and writes a
 * real PNG when it is asked for a screenshot.
 *
 * @returns a reader for the recorded argv
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
      // `simctl io <udid> screenshot <path>` is given the path and writes the file itself.
      `if (args[1] === 'io' && args[3] === 'screenshot') {`,
      `  fs.writeFileSync(args[4], Buffer.from("${PNG_HEADER_ESCAPE}stub-screenshot", 'binary'));`,
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
 * Install a stub `adb` that reports one attached device and writes a PNG to **stdout** for
 * `exec-out screencap -p`, exactly as the real one does.
 *
 * This is the fixture the whole Android screenshot path rests on: the bytes go through a real pipe
 * into a real file descriptor, which is the one thing a mocked `spawn` cannot show.
 */
async function installStubAdbAsync(projectRoot: string): Promise<void> {
  const scriptPath = path.join(projectRoot, '.stub-bin', 'adb-stub.js');
  await fs.promises.mkdir(path.dirname(scriptPath), { recursive: true });
  await fs.promises.writeFile(
    scriptPath,
    [
      `const args = process.argv.slice(2);`,
      `if (args[0] === 'devices') {`,
      `  process.stdout.write('List of devices attached\\nemulator-5554\\tdevice\\n');`,
      `  process.exit(0);`,
      `}`,
      `if (args.includes('screencap')) {`,
      // Bytes a pty would rewrite, so a path that went through `adb shell` would corrupt them.
      `  process.stdout.write(Buffer.from("${PNG_HEADER_ESCAPE}\\r\\n\\x00\\xff", 'binary'));`,
      `  process.exit(0);`,
      `}`,
      `process.exit(0);`,
    ].join('\n')
  );
  await installStubBinAsync(path.join(projectRoot, '.stub-bin'), 'adb', scriptPath);
}

/** Give the fixture an Expo Router `app/` directory with the named route files. */
async function writeRoutesAsync(projectRoot: string, files: string[]): Promise<void> {
  for (const file of files) {
    const target = path.join(projectRoot, 'app', file);
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.writeFile(target, 'export default function Route() { return null; }\n');
  }
}

/** Point the project's dev-server lock at the stub, the way an `exagent`-started server does. */
async function holdLockForAsync(projectRoot: string, stub: StubDevServer): Promise<() => void> {
  return await holdDevLockAsync(projectRoot, {
    url: stub.url,
    port: stub.port,
    pid: process.pid,
    startedAt: new Date().toISOString(),
    projectRoot,
  });
}

describe('exagent smoke', () => {
  describe('--help', () => {
    it('names the eight phases and the three exit codes', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['smoke', '--help']);

      expect(result.exitCode).toBe(0);
      expect(result.all).toContain('--route');
      expect(result.all).toContain('--start');
      expect(result.all).toContain('--window');
      expect(result.all).toContain('--no-screenshot');
      expect(result.all).toContain('0');
      expect(result.all).toContain('20');
      expect(result.all).toContain('22');
    });

    // The two limits a reader would otherwise assume away, both of them llp/0005 findings.
    it('says a runtime with no debugger never passes, and that the window is a window', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['smoke', '--help']);

      expect(result.all).toContain('never passes');
      expect(result.all).toContain('before it opened is not in it');
    });

    it('appears in the top-level help, next to the commands it composes', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['--help']);

      expect(result.all).toContain('smoke');
      expect(result.all).toContain('Debug a running app');
    });
  });

  // @ref llp/0010-agent-conventions.rfc.md §Exit codes. `--start` is opt-in, so a run that finds
  // no dev server reports that the operation failed rather than starting one.
  describe('with no dev server', () => {
    it('exits 20 and never starts one without --start', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeExagentAsync(
        projectRoot,
        // A port nothing is on, named explicitly so no scan can find another project's server.
        ['smoke', '--json', '--port', '59117'],
        { env: stubExpoEnv(projectRoot), reject: false }
      );

      expect(result.exitCode).toBe(20);
      const report = JSON.parse(result.stdout);
      expect(report).toMatchObject({ ok: false, outcome: 'failed', started: false });
      expect(report.phases[0]).toMatchObject({ id: 'dev-server', status: 'failed' });
      // Everything after it says it did not run, rather than reading as a pass.
      for (const phase of report.phases.slice(1)) {
        expect(phase.status).toBe('skipped');
        expect(phase.reason).toEqual(expect.any(String));
      }
      expect(report.screenshot.ok).toBe(false);
    });

    it('says what to run, on stderr, for a person', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['smoke', '--port', '59118'], {
        env: stubExpoEnv(projectRoot),
        reject: false,
      });

      expect(result.exitCode).toBe(20);
      expect(result.stderr).toContain('Why:');
      expect(result.stderr).toContain('How:');
      expect(result.all).toContain('npx exagent dev --detach');
    });
  });

  describe('against a dev server with no app', () => {
    let stub: StubDevServer | null = null;
    let release: (() => void) | null = null;

    afterEach(async () => {
      release?.();
      await stub?.close();
      stub = null;
      release = null;
    });

    // No app and no device: nothing can open one, and nothing is known about the app. `22`, so a
    // caller reads "look again" rather than "the app is broken".
    it('exits 22 when nothing is attached and no device answers', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      stub = await startStubDevServerAsync({ projectRoot, targets: [] });
      release = await holdLockForAsync(projectRoot, stub);

      const result = await executeExagentAsync(
        projectRoot,
        ['smoke', '--json', '--timeout', '4s'],
        {
          // An empty `PATH`, so neither a stub nor this machine's own `xcrun` and `adb` can be
          // found. Inheriting the real one made this pass against a simulator that happened to be
          // booted on the developer's Mac, which is a test of the machine rather than of the code.
          env: { PATH: path.join(projectRoot, '.no-bin') },
          reject: false,
        }
      );

      expect(result.exitCode).toBe(22);
      const report = JSON.parse(result.stdout);
      expect(report.outcome).toBe('inconclusive');
      expect(report.phases.find((phase: any) => phase.id === 'app').status).toBe('inconclusive');
      expect(report.appsConnected).toBe(0);
      expect(report.screenshot.ok).toBe(false);
    });

    // The gate opens one rather than waiting out its budget on a state it could change itself.
    it('opens the app with the device tool when there is a device and no app', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const readXcrun = await installStubXcrunAsync(projectRoot);
      stub = await startStubDevServerAsync({ projectRoot, targets: [] });
      release = await holdLockForAsync(projectRoot, stub);

      await executeExagentAsync(projectRoot, ['smoke', '--ios', '--json', '--timeout', '4s'], {
        env: stubExpoEnv(projectRoot),
        reject: false,
      });

      expect(readXcrun()).toContainEqual([
        'simctl',
        'openurl',
        SIMULATOR_UDID,
        // The root route needs the `?` marker for Expo Go, per llp/0005 §The root route.
        `exp://127.0.0.1:${stub.port}/--/?`,
      ]);
    });
  });

  describe('the entry bundle', () => {
    it('exits 20 for a bundle that does not compile, and reads no app', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      await installStubXcrunAsync(projectRoot);
      const stub = await startStubDevServerAsync({
        projectRoot,
        targets: [EXPO_GO_TARGET],
        bundle: 'broken',
      });
      const release = await holdLockForAsync(projectRoot, stub);

      try {
        const result = await executeExagentAsync(projectRoot, ['smoke', '--ios', '--json'], {
          env: stubExpoEnv(projectRoot),
          reject: false,
        });

        expect(result.exitCode).toBe(20);
        const report = JSON.parse(result.stdout);
        expect(report.outcome).toBe('failed');
        expect(report.bundle).toMatchObject({
          checked: true,
          ok: false,
          error: { type: 'TransformError', filename: 'src/app/index.tsx' },
        });
        expect(report.phases.find((phase: any) => phase.id === 'app').status).toBe('skipped');
      } finally {
        release();
        await stub.close();
      }
    });
  });

  // @ref llp/0010-agent-conventions.rfc.md §The second: `dev:wait`. A dev server that proved it
  // serves another project is `20`, never `22`, and nothing of its app is read.
  it('exits 20 for another project s dev server', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({
      projectRoot: '/somewhere/else',
      targets: [EXPO_GO_TARGET],
    });

    try {
      const result = await executeExagentAsync(
        projectRoot,
        ['smoke', '--json', '--dev-server-url', stub.url],
        { env: stubExpoEnv(projectRoot), reject: false }
      );

      expect(result.exitCode).toBe(20);
      const report = JSON.parse(result.stdout);
      expect(report.projectRootMatched).toBe(false);
      expect(report.phases.find((phase: any) => phase.id === 'bundler-ready').status).toBe(
        'failed'
      );
    } finally {
      await stub.close();
    }
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §Verifying the route. The process boundary this tier
  // owns: a bogus route reaches the device tool **zero** times.
  describe('the route check', () => {
    it('exits 1 for a route the project has not got, and opens nothing', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      await writeRoutesAsync(projectRoot, ['index.tsx', 'notes.tsx']);
      const readXcrun = await installStubXcrunAsync(projectRoot);
      const stub = await startStubDevServerAsync({ projectRoot, targets: [EXPO_GO_TARGET] });
      const release = await holdLockForAsync(projectRoot, stub);

      try {
        const result = await executeExagentAsync(
          projectRoot,
          ['smoke', '--ios', '--json', '--route', '/note'],
          { env: stubExpoEnv(projectRoot), reject: false }
        );

        // A route that does not exist is the caller's own argument being wrong: exit 1, not a
        // verdict on the project.
        expect(result.exitCode).toBe(1);
        const { error } = JSON.parse(result.stdout);
        expect(error.code).toBe('ROUTE_NOT_FOUND');
        // And the suggestion keeps the command the caller was running (friction run 5).
        expect(error.suggestedCommand).toBe('npx exagent smoke --route /notes');
        expect(readXcrun().filter((argv) => argv.includes('openurl'))).toEqual([]);
      } finally {
        release();
        await stub.close();
      }
    });
  });

  describe('the screenshot', () => {
    // The exact argv handed to a stub `xcrun`, which is the half of this primitive that only fails
    // on a machine with a simulator on it.
    it('hands xcrun simctl io the udid and the path', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const readXcrun = await installStubXcrunAsync(projectRoot);
      const stub = await startStubDevServerAsync({ projectRoot, targets: [] });
      const release = await holdLockForAsync(projectRoot, stub);
      const shotPath = path.join(projectRoot, 'shot.png');

      try {
        await executeExagentAsync(
          projectRoot,
          ['smoke', '--ios', '--json', '--timeout', '4s', '--screenshot', shotPath],
          { env: stubExpoEnv(projectRoot), reject: false }
        );

        expect(readXcrun()).toContainEqual([
          'simctl',
          'io',
          SIMULATOR_UDID,
          'screenshot',
          shotPath,
        ]);
        expect(fs.existsSync(shotPath)).toBe(true);
        expect(fs.readFileSync(shotPath).subarray(0, 8)).toEqual(
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        );
      } finally {
        release();
        await stub.close();
      }
    });

    // The one property no mock can show: `adb exec-out` writes the PNG to stdout, and the bytes
    // have to reach the file through a real pipe unchanged. A `\r\n` in the payload is what a pty
    // would rewrite, which is why `exec-out` is used rather than `shell`.
    it('redirects adb exec-out screencap into the file, byte for byte', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      await installStubAdbAsync(projectRoot);
      const stub = await startStubDevServerAsync({ projectRoot, targets: [] });
      const release = await holdLockForAsync(projectRoot, stub);
      const shotPath = path.join(projectRoot, 'android.png');

      try {
        await executeExagentAsync(
          projectRoot,
          ['smoke', '--android', '--json', '--timeout', '4s', '--screenshot', shotPath],
          { env: stubExpoEnv(projectRoot), reject: false }
        );

        expect(fs.existsSync(shotPath)).toBe(true);
        expect(fs.readFileSync(shotPath)).toEqual(
          Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x0d, 0x0a, 0x00, 0xff])
        );
      } finally {
        release();
        await stub.close();
      }
    });

    it('runs no device tool at all with --no-screenshot', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const readXcrun = await installStubXcrunAsync(projectRoot);
      const stub = await startStubDevServerAsync({ projectRoot, targets: [EXPO_GO_TARGET] });
      const release = await holdLockForAsync(projectRoot, stub);

      try {
        const result = await executeExagentAsync(
          projectRoot,
          ['smoke', '--ios', '--json', '--no-screenshot', '--timeout', '6s'],
          { env: stubExpoEnv(projectRoot), reject: false }
        );

        const report = JSON.parse(result.stdout);
        expect(report.screenshot).toMatchObject({ ok: false, path: '' });
        expect(report.screenshot.reason).toContain('--no-screenshot');
        expect(readXcrun().filter((argv) => argv.includes('screenshot'))).toEqual([]);
      } finally {
        release();
        await stub.close();
      }
    });
  });

  // @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — the property the flag exists
  // for, checked as the property rather than as a substring.
  describe('--json', () => {
    it('prints exactly one parseable object, whatever the outcome', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeExagentAsync(
        projectRoot,
        ['smoke', '--json', '--port', '59119'],
        { env: stubExpoEnv(projectRoot), reject: false }
      );

      expect(() => JSON.parse(result.stdout)).not.toThrow();
      expect(Object.keys(JSON.parse(result.stdout)).sort()).toEqual([
        'appsConnected',
        'bundle',
        'devServerUrl',
        'deviceId',
        'durationMs',
        'errors',
        'followups',
        'ok',
        'outcome',
        'phases',
        'platform',
        'projectRootMatched',
        'route',
        'routeCheck',
        'runtimeSupported',
        'screenshot',
        'source',
        'started',
        'untrusted',
      ]);
    });

    it('prints the error envelope for a command that was wrong', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeExagentAsync(projectRoot, ['smoke', '--json', '--bogus'], {
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      const { error } = JSON.parse(result.stdout);
      expect(error.code).toBe('BAD_ARGS');
      expect(error.suggestedCommand).toBe('npx exagent smoke --help');
    });

    // @ref llp/0010-agent-conventions.rfc.md §What app counting can and cannot see.
    it('refuses --platform web and names the command that answers for web', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeExagentAsync(
        projectRoot,
        ['smoke', '--json', '--platform', 'web'],
        { reject: false }
      );

      expect(result.exitCode).toBe(1);
      const { error } = JSON.parse(result.stdout);
      expect(error.code).toBe('BAD_ARGS');
      expect(error.suggestedCommand).toBe('npx exagent dev:wait --platform web');
    });
  });

  it('puts the run on the event stream, with every phase', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const eventsPath = path.join(projectRoot, 'events.jsonl');

    await executeExagentAsync(projectRoot, ['smoke', '--json', '--port', '59120'], {
      env: { ...stubExpoEnv(projectRoot), LOG_EVENTS: eventsPath },
      reject: false,
    });

    const events = fs
      .readFileSync(eventsPath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    const smoke = events.find((entry) => entry._e === 'cli:smoke');
    expect(smoke).toMatchObject({ outcome: 'failed', started: false });
    expect(smoke.phases).toHaveLength(8);
  });
});
