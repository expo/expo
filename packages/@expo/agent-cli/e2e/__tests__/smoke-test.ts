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
  executeAgentCliAsync,
  holdDevLockAsync,
  installStubBinAsync,
  readDevLockAsync,
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
async function installStubXcrunAsync(
  projectRoot: string,
  /**
   * A file the stub writes when it is asked to open a URL, or null.
   *
   * Paired with the stub dev server's `targetsAppearWithFile`, it is what makes "the app attached"
   * a **consequence of the deep link** rather than a fixture that was true all along — which is
   * the only way this tier can show that the gate waits for a real target instead of passing on
   * the exit code of `simctl openurl`.
   */
  opensMarker: string | null = null
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
      ...(opensMarker
        ? [
            `if (args[1] === 'openurl') {`,
            `  fs.writeFileSync(${JSON.stringify(opensMarker)}, 'opened');`,
            `}`,
          ]
        : []),
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

/**
 * A stub `xcrun` for the boot path: several simulators, all shut, and every call recorded.
 *
 * The list is what `pickSimulator` chooses from, so the fixture is the machine Kudo's run met — a
 * fresh device that was used most recently, and an older one that actually has the app on it.
 */
async function installStubXcrunForBootAsync(
  projectRoot: string,
  devices: { udid: string; name: string; lastBootedAt?: string }[]
): Promise<() => string[][]> {
  const logPath = path.join(projectRoot, '.stub-boot-xcrun.jsonl');
  const bootedPath = path.join(projectRoot, '.stub-booted-udid');
  const scriptPath = path.join(projectRoot, '.stub-bin', 'xcrun-boot-stub.js');
  const listing = {
    devices: {
      'com.apple.CoreSimulator.SimRuntime.iOS-26-5': devices.map((device) => ({
        udid: device.udid,
        name: device.name,
        state: 'Shutdown',
        isAvailable: true,
        ...(device.lastBootedAt ? { lastBootedAt: device.lastBootedAt } : {}),
      })),
    },
  };
  await fs.promises.mkdir(path.dirname(scriptPath), { recursive: true });
  await fs.promises.writeFile(
    scriptPath,
    [
      `const fs = require('fs');`,
      `const args = process.argv.slice(2);`,
      `fs.appendFileSync(${JSON.stringify(logPath)}, JSON.stringify(args) + '\\n');`,
      // A boot is remembered, the way a real `simctl` does: the device probe that runs *after*
      // the boot has to find the device this run just started, or every phase after it looks at a
      // machine with no simulator on it.
      `const bootedPath = ${JSON.stringify(bootedPath)};`,
      `const booted = () => { try { return fs.readFileSync(bootedPath, 'utf8').trim(); } catch { return ''; } };`,
      `if (args[1] === 'boot') { fs.writeFileSync(bootedPath, args[2]); process.exit(0); }`,
      `const listing = ${JSON.stringify(JSON.stringify(listing))};`,
      // `list devices booted` finds nothing until a boot has happened, which is what makes the run
      // reach the boot decision at all.
      `if (args[1] === 'list' && args.includes('booted')) {`,
      `  const up = booted();`,
      `  const all = JSON.parse(listing).devices['com.apple.CoreSimulator.SimRuntime.iOS-26-5'];`,
      `  const mine = all.filter((d) => d.udid === up).map((d) => ({ ...d, state: 'Booted' }));`,
      `  process.stdout.write(JSON.stringify(mine.length ? { devices: { 'com.apple.CoreSimulator.SimRuntime.iOS-26-5': mine } } : { devices: {} }));`,
      `  process.exit(0);`,
      `}`,
      `if (args[1] === 'list') {`,
      `  process.stdout.write(listing);`,
      `  process.exit(0);`,
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

/** Give the fixture an Expo Router `app/` directory with the named route files. */
async function writeRoutesAsync(projectRoot: string, files: string[]): Promise<void> {
  for (const file of files) {
    const target = path.join(projectRoot, 'app', file);
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.writeFile(target, 'export default function Route() { return null; }\n');
  }
}

/**
 * A `HOME` whose CoreSimulator tree says which apps each simulator has.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §The device that can open the app
 * The device choice is made by **reading the simulator's disk**, because `simctl listapps` and
 * `simctl get_app_container` both refuse on a device that is not booted — and every device the
 * choice is about is shut. So the fixture is a directory tree rather than a stub command, and the
 * `Info.plist` files in it are real plists that the real `plutil` reads.
 *
 * @param installed the application ids to install, per simulator udid.
 */
async function writeSimulatorHomeAsync(
  projectRoot: string,
  installed: Record<string, string[]>
): Promise<string> {
  const home = path.join(projectRoot, '.sim-home');
  for (const [udid, appIds] of Object.entries(installed)) {
    for (const [index, appId] of appIds.entries()) {
      const bundle = path.join(
        home,
        'Library/Developer/CoreSimulator/Devices',
        udid,
        'data/Containers/Bundle/Application',
        `container-${index}`,
        `${appId}.app`
      );
      await fs.promises.mkdir(bundle, { recursive: true });
      await fs.promises.writeFile(
        path.join(bundle, 'Info.plist'),
        [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">`,
          `<plist version="1.0"><dict>`,
          `<key>CFBundleIdentifier</key><string>${appId}</string>`,
          `</dict></plist>`,
        ].join('\n')
      );
    }
  }
  return home;
}

/**
 * The stub `expo` and **no device tools at all**, for the cases that are about the dev server.
 *
 * `stubExpoEnv` inherits this machine's `PATH`, so `xcrun` on it is the real one — and once a run
 * gets past the readiness check it will happily boot the developer's own simulator and wait two
 * minutes for an app that was never installed on it. The stub `expo` is resolved through the
 * project's `node_modules` rather than through `PATH`, so dropping the inherited entries costs
 * these cases nothing and keeps them tests of the code rather than of the machine.
 */
function devServerOnlyEnv(projectRoot: string): Record<string, string> {
  return { PATH: path.join(projectRoot, '.no-bin') };
}

/** Point the project's dev-server lock at the stub, the way an `@expo/agent-cli`-started server does. */
async function holdLockForAsync(projectRoot: string, stub: StubDevServer): Promise<() => void> {
  return await holdDevLockAsync(projectRoot, {
    url: stub.url,
    port: stub.port,
    pid: process.pid,
    startedAt: new Date().toISOString(),
    projectRoot,
  });
}

describe('@expo/agent-cli smoke', () => {
  describe('--help', () => {
    it('names the eight phases and the three exit codes', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeAgentCliAsync(projectRoot, ['smoke', '--help']);

      expect(result.exitCode).toBe(0);
      expect(result.all).toContain('--route');
      expect(result.all).toContain('--start');
      expect(result.all).toContain('--no-start');
      expect(result.all).toContain('--window');
      expect(result.all).toContain('--no-screenshot');
      expect(result.all).toContain('0');
      expect(result.all).toContain('20');
      expect(result.all).toContain('22');
    });

    // @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment. A command that
    // starts a dev server and boots a simulator changes the machine, so the help says so before
    // anybody runs it — and says what to do to keep the dev server afterwards.
    it(`says it starts what is missing, puts it back, and does not build`, async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeAgentCliAsync(projectRoot, ['smoke', '--help']);

      expect(result.all).toContain('brings its own environment');
      expect(result.all).toContain('stops exactly what it started');
      expect(result.all).toContain('It does not build');
    });

    // The two limits a reader would otherwise assume away, both of them llp/0005 findings.
    it('says a runtime with no debugger never passes, and that the window is a window', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeAgentCliAsync(projectRoot, ['smoke', '--help']);

      expect(result.all).toContain('never passes');
      expect(result.all).toContain('before it opened is not in it');
    });

    it('appears in the top-level help, next to the commands it composes', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeAgentCliAsync(projectRoot, ['--help']);

      expect(result.all).toContain('smoke');
      // Renamed twice: wave 34 tried "Check a running app", and Kudo picked the familiar dev
      // vocabulary over it [confirmed — Kudo, 2026-08-28].
      expect(result.all).toContain('Debug a running app');
    });
  });

  // @ref llp/0010-agent-conventions.rfc.md §Exit codes. `--no-start` is the attach-only run this
  // command used to be by default: it reports that the operation failed rather than starting one.
  describe('with no dev server and --no-start', () => {
    it('exits 20 and never starts one', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeAgentCliAsync(
        projectRoot,
        // A port nothing is on, named explicitly so no scan can find another project's server.
        ['smoke', '--json', '--no-start', '--port', '59117'],
        { env: stubExpoEnv(projectRoot), reject: false }
      );

      expect(result.exitCode).toBe(20);
      const report = JSON.parse(result.stdout);
      expect(report).toMatchObject({ ok: false, outcome: 'failed', started: false });
      expect(report.environment).toEqual({
        devServer: 'absent',
        device: 'absent',
        deviceChoice: null,
        cleanup: [],
      });
      expect(report.phases[0]).toMatchObject({ id: 'dev-server', status: 'failed' });
      // Everything after it says it did not run, rather than reading as a pass — and the two
      // conditional phases are not in the list at all, because there was nothing to start.
      expect(report.phases.map((phase: any) => phase.id)).not.toContain('start-dev-server');
      expect(report.phases.map((phase: any) => phase.id)).not.toContain('boot-device');
      for (const phase of report.phases.slice(1)) {
        expect(phase.status).toBe('skipped');
        expect(phase.reason).toEqual(expect.any(String));
      }
      expect(report.screenshot.ok).toBe(false);
    });

    it('says what to run, on stderr, for a person', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeAgentCliAsync(
        projectRoot,
        ['smoke', '--no-start', '--port', '59118'],
        { env: stubExpoEnv(projectRoot), reject: false }
      );

      expect(result.exitCode).toBe(20);
      expect(result.stderr).toContain('Why:');
      expect(result.stderr).toContain('How:');
      expect(result.all).toContain('npx @expo/agent-cli dev --detach');
    });
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §The run brings its own environment.
  //
  // The property no unit test can show: a *second process* was started, it published this
  // project's lock, and it is gone by the time this command's own process exits. The dev server is
  // the stub `expo` bin, which takes the lock exactly as the real one does, because the wrapper
  // that takes it is real here.
  describe('with no dev server, by default', () => {
    /** Whether this project's dev-server lock still answers. */
    async function lockHeldAsync(projectRoot: string): Promise<boolean> {
      return (await readDevLockAsync(projectRoot)) != null;
    }

    it('starts one, and stops it again before it exits', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      try {
        const result = await executeAgentCliAsync(
          projectRoot,
          // No screenshot and no device: this case is about the dev server, and a stub `xcrun` is
          // what the screenshot tests own.
          ['smoke', '--json', '--no-screenshot', '--port', '9351', '--timeout', '10s'],
          {
            env: {
              ...devServerOnlyEnv(projectRoot),
              STUB_EXPO_DELAY_MS: '30000',
              STUB_EXPO_DEV_SERVER_PORT: '9351',
              // The stub binds the port and answers `GET /status`, which is what `--wait-ready`
              // needs — and `--wait-ready` is what the start phase runs.
              STUB_EXPO_LISTEN: '1',
            },
            reject: false,
          }
        );

        const report = JSON.parse(result.stdout);
        // The dev server was started for this run, and the phase that did it is in the list.
        expect(report.environment.devServer).toBe('started');
        expect(report.started).toBe(true);
        expect(report.phases[0]).toMatchObject({ id: 'start-dev-server', status: 'ok' });
        expect(report.phases[1]).toMatchObject({ id: 'dev-server', status: 'ok' });

        // And it was put back. Both halves: the run says it stopped it, and the lock agrees.
        expect(report.environment.cleanup).toContainEqual(
          expect.objectContaining({ resource: 'dev-server', ok: true })
        );
        expect(await lockHeldAsync(projectRoot)).toBe(false);
      } finally {
        await executeAgentCliAsync(projectRoot, ['dev:stop', '--json'], {
          env: stubExpoEnv(projectRoot),
          reject: false,
        });
      }
    });

    // @ref llp/0005-runtime-loop-tools.rfc.md §What a cold start costs, and who pays for it.
    //
    // The deterministic form of the whole finding, through the published bin and a real second
    // process. The stub answers the entry bundle **four seconds late**, which is what a dev server
    // that has never bundled does, and `--timeout 2s` is the window the caller gave the *reads*.
    // A run that charged the first compile to that window would report `bundle: inconclusive`
    // after two seconds and go no further; this one waits it out on the bootstrap's own budget.
    it('does not charge the first compile of a dev server it started to --timeout', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      try {
        const result = await executeAgentCliAsync(
          projectRoot,
          ['smoke', '--json', '--no-screenshot', '--port', '9352', '--timeout', '2s'],
          {
            env: {
              ...devServerOnlyEnv(projectRoot),
              STUB_EXPO_DELAY_MS: '30000',
              STUB_EXPO_DEV_SERVER_PORT: '9352',
              STUB_EXPO_LISTEN: '1',
              STUB_EXPO_BUNDLE_DELAY_MS: '4000',
            },
            reject: false,
          }
        );

        const report = JSON.parse(result.stdout);
        expect(report.environment.devServer).toBe('started');
        const bundlePhase = report.phases.find((phase: any) => phase.id === 'bundle');
        // It compiled, and it took longer than the whole reading window to do it.
        expect(bundlePhase).toMatchObject({ status: 'ok' });
        expect(bundlePhase.ms).toBeGreaterThan(2_000);
        expect(report.bundle).toMatchObject({ checked: true, ok: true });
      } finally {
        await executeAgentCliAsync(projectRoot, ['dev:stop', '--json'], {
          env: stubExpoEnv(projectRoot),
          reject: false,
        });
      }
    });

    // The other half of "restore what you found": a dev server this run did not start is not this
    // run's to take away, however the run ends.
    it('leaves a dev server that was already running', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const stub = await startStubDevServerAsync({ projectRoot, targets: [] });
      const release = await holdLockForAsync(projectRoot, stub);

      try {
        const result = await executeAgentCliAsync(
          projectRoot,
          ['smoke', '--json', '--no-screenshot', '--timeout', '4s'],
          { env: { PATH: path.join(projectRoot, '.no-bin') }, reject: false }
        );

        const report = JSON.parse(result.stdout);
        expect(report.environment.devServer).toBe('reused');
        expect(report.started).toBe(false);
        expect(report.environment.cleanup).toEqual([]);
        expect(report.phases.map((phase: any) => phase.id)).not.toContain('start-dev-server');
        // Still answering, and still this project's.
        expect(await lockHeldAsync(projectRoot)).toBe(true);
      } finally {
        release();
        await stub.close();
      }
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

      const result = await executeAgentCliAsync(
        projectRoot,
        ['smoke', '--json', '--no-start', '--timeout', '4s'],
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

      await executeAgentCliAsync(projectRoot, ['smoke', '--ios', '--json', '--timeout', '4s'], {
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

  // @ref llp/0005-runtime-loop-tools.rfc.md §What a cold start costs, and who pays for it.
  //
  // `xcrun simctl openurl` exits 0 the moment the URL is handed to the device, and the app behind
  // it may be a minute from registering a debugger target — or may never register one, because it
  // is not installed on the simulator that was booted. What the gate waits for is the *target*,
  // and this tier is the only one that can show it: the dev server lists nothing until the stub
  // `xcrun` writes the file the open produces, so an attach here is a **consequence of the link**
  // rather than a fixture that was true all along.
  describe('what counts as the app being there', () => {
    it('reports the app connected only after the deep link produced a target', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const opened = path.join(projectRoot, '.app-opened');
      await installStubXcrunAsync(projectRoot, opened);
      const stub = await startStubDevServerAsync({
        projectRoot,
        targets: [EXPO_GO_TARGET],
        targetsAppearWithFile: opened,
      });
      const release = await holdLockForAsync(projectRoot, stub);

      try {
        const result = await executeAgentCliAsync(
          projectRoot,
          ['smoke', '--ios', '--json', '--no-screenshot', '--timeout', '20s'],
          { env: stubExpoEnv(projectRoot), reject: false }
        );

        const report = JSON.parse(result.stdout);
        const app = report.phases.find((phase: any) => phase.id === 'app');
        expect(app).toMatchObject({ status: 'ok' });
        expect(app.reason).toContain('to connect one');
        expect(report.appsConnected).toBe(1);
        // The file is the proof that the target arrived because of the open, not before it.
        expect(fs.existsSync(opened)).toBe(true);
      } finally {
        release();
        await stub.close();
      }
    });

    // Expo Go missing from the simulator, exactly: the link is accepted and nothing ever attaches.
    it('never passes on the deep link alone when nothing attaches', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const readXcrun = await installStubXcrunAsync(projectRoot);
      const stub = await startStubDevServerAsync({
        projectRoot,
        targets: [EXPO_GO_TARGET],
        // A file the stub `xcrun` above is not writing, so no target ever appears.
        targetsAppearWithFile: path.join(projectRoot, '.never-written'),
      });
      const release = await holdLockForAsync(projectRoot, stub);

      try {
        const result = await executeAgentCliAsync(
          projectRoot,
          ['smoke', '--ios', '--json', '--no-screenshot', '--timeout', '4s'],
          { env: stubExpoEnv(projectRoot), reject: false }
        );

        // The link really was opened, and exit 22 rather than 0 all the same.
        expect(readXcrun().some((argv) => argv.includes('openurl'))).toBe(true);
        expect(result.exitCode).toBe(22);
        const report = JSON.parse(result.stdout);
        expect(report.phases.find((phase: any) => phase.id === 'app')).toMatchObject({
          status: 'inconclusive',
        });
        expect(report.appsConnected).toBe(0);
        // And nothing after it claims to have read the app it never reached.
        for (const id of ['route', 'runtime', 'errors']) {
          expect(report.phases.find((phase: any) => phase.id === id)).toMatchObject({
            status: 'skipped',
          });
        }
      } finally {
        release();
        await stub.close();
      }
    });
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §The device that can open the app.
  //
  // Kudo's run: a dev-client project booted a fresh simulator and the deep link came back `115` —
  // no handler for the scheme — after a 12.4 s boot for a device that could never have opened it.
  // The choice is made by reading each simulator's disk, so the fixture here is a `HOME` with a
  // CoreSimulator tree in it and a stub `xcrun` that lists the devices, all shut.
  describe('choosing the device to boot', () => {
    const FRESH = 'E2E-FRESH-0000';
    const HAS_APP = 'E2E-HASAPP-000';
    const DEV_CLIENT_ID = 'com.example.dcapp';

    /**
     * A dev-client project whose `app.json` names a bundle identifier.
     *
     * The `fresh` fixture is the one whose build record matches its fingerprint, so the plan needs
     * no build and the run reaches the device choice — which is the case under test. The bundle id
     * is written here rather than into the shared fixture, because it is this test's question.
     */
    async function devClientFixtureAsync(): Promise<string> {
      const projectRoot = await setupFixtureAsync('dev-client-fresh-app');
      const configPath = path.join(projectRoot, 'app.json');
      const config = JSON.parse(await fs.promises.readFile(configPath, 'utf8'));
      config.expo.ios = { ...config.expo.ios, bundleIdentifier: DEV_CLIENT_ID };
      await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2));
      return projectRoot;
    }

    async function runAsync(
      projectRoot: string,
      home: string,
      stub: StubDevServer
    ): Promise<Record<string, any>> {
      const release = await holdLockForAsync(projectRoot, stub);
      try {
        const result = await executeAgentCliAsync(
          projectRoot,
          ['smoke', '--ios', '--json', '--no-screenshot', '--timeout', '4s'],
          { env: { ...stubExpoEnv(projectRoot), HOME: home }, reject: false }
        );
        return JSON.parse(result.stdout);
      } finally {
        release();
      }
    }

    it('boots the device that has the app, not the one used most recently', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const readXcrun = await installStubXcrunForBootAsync(projectRoot, [
        { udid: FRESH, name: 'iPhone 17 Pro Max', lastBootedAt: '2026-08-30T09:00:00Z' },
        { udid: HAS_APP, name: 'iPhone 17 Pro', lastBootedAt: '2026-08-20T09:00:00Z' },
      ]);
      // Only the older one has Expo Go, which is what a `go-app` opens.
      const home = await writeSimulatorHomeAsync(projectRoot, {
        [FRESH]: [],
        [HAS_APP]: ['host.exp.Exponent'],
      });
      const stub = await startStubDevServerAsync({ projectRoot, targets: [] });

      try {
        const report = await runAsync(projectRoot, home, stub);

        const booted = readXcrun().filter((argv) => argv[1] === 'boot');
        expect(booted).toEqual([['simctl', 'boot', HAS_APP]]);
        expect(report.environment.deviceChoice).toContain('Expo Go');
      } finally {
        await stub.close();
      }
    });

    // The refusal, and the assertion that matters most: **no boot was issued at all**. The minute
    // is the thing being saved, so a run that decided correctly and booted anyway would still be
    // the bug.
    it('refuses before booting when no device has the app', async () => {
      const projectRoot = await devClientFixtureAsync();
      const readXcrun = await installStubXcrunForBootAsync(projectRoot, [
        { udid: FRESH, name: 'iPhone 17 Pro', lastBootedAt: '2026-08-30T09:00:00Z' },
      ]);
      // A simulator with Expo Go on it and *not* this project's development build.
      const home = await writeSimulatorHomeAsync(projectRoot, {
        [FRESH]: ['host.exp.Exponent'],
      });
      const stub = await startStubDevServerAsync({ projectRoot, targets: [] });

      try {
        const report = await runAsync(projectRoot, home, stub);

        expect(readXcrun().filter((argv) => argv[1] === 'boot')).toEqual([]);
        const boot = report.phases.find((phase: any) => phase.id === 'boot-device');
        expect(boot).toMatchObject({ status: 'failed' });
        expect(boot.reason).toContain(DEV_CLIENT_ID);
        expect(boot.reason).toContain('would open nothing');
        // Nothing was booted, so the machine is as it was found.
        expect(report.environment.device).toBe('absent');
        expect(report.environment.cleanup).toEqual([]);
      } finally {
        await stub.close();
      }
    });

    // An Expo Go project is **not** exempt, and that is a correction to what this was expected to
    // do: `simctl openurl exp://…` on a simulator without Expo Go answers `115` exactly like a
    // dev-client scheme does [observed — live, 2026-08-30, a freshly created simulator]. The open
    // path installs nothing, so the same rule has to hold for both.
    it('refuses for an Expo Go project on a machine with no Expo Go either', async () => {
      const projectRoot = await setupFixtureAsync('go-app');
      const readXcrun = await installStubXcrunForBootAsync(projectRoot, [
        { udid: FRESH, name: 'iPhone 17 Pro', lastBootedAt: '2026-08-30T09:00:00Z' },
      ]);
      const home = await writeSimulatorHomeAsync(projectRoot, { [FRESH]: [] });
      const stub = await startStubDevServerAsync({ projectRoot, targets: [] });

      try {
        const report = await runAsync(projectRoot, home, stub);

        expect(readXcrun().filter((argv) => argv[1] === 'boot')).toEqual([]);
        const boot = report.phases.find((phase: any) => phase.id === 'boot-device');
        expect(boot.reason).toContain('Expo Go');
        // And it names the command that puts Expo Go on a simulator.
        expect(boot.reason).toContain('expo start --ios');
      } finally {
        await stub.close();
      }
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
        const result = await executeAgentCliAsync(projectRoot, ['smoke', '--ios', '--json'], {
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

  // @ref llp/0010-agent-conventions.rfc.md §The second: the readiness gate. A dev server that proved it
  // serves another project is `20`, never `22`, and nothing of its app is read.
  it('exits 20 for another project s dev server', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const stub = await startStubDevServerAsync({
      projectRoot: '/somewhere/else',
      targets: [EXPO_GO_TARGET],
    });

    try {
      const result = await executeAgentCliAsync(
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
        const result = await executeAgentCliAsync(
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
        expect(error.suggestedCommand).toBe('npx @expo/agent-cli smoke --route /notes');
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
        await executeAgentCliAsync(
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
        await executeAgentCliAsync(
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
        const result = await executeAgentCliAsync(
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

      const result = await executeAgentCliAsync(
        projectRoot,
        ['smoke', '--json', '--no-start', '--port', '59119'],
        { env: stubExpoEnv(projectRoot), reject: false }
      );

      expect(() => JSON.parse(result.stdout)).not.toThrow();
      expect(Object.keys(JSON.parse(result.stdout)).sort()).toEqual([
        'appsConnected',
        'bundle',
        'devServerUrl',
        'deviceBackend',
        'deviceId',
        'durationMs',
        'environment',
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

      const result = await executeAgentCliAsync(projectRoot, ['smoke', '--json', '--bogus'], {
        reject: false,
      });

      expect(result.exitCode).toBe(1);
      const { error } = JSON.parse(result.stdout);
      expect(error.code).toBe('BAD_ARGS');
      expect(error.suggestedCommand).toBe('npx @expo/agent-cli smoke --help');
    });

    // @ref llp/0010-agent-conventions.rfc.md §What app counting can and cannot see.
    it('refuses --platform web and names the command that answers for web', async () => {
      const projectRoot = await setupFixtureAsync('go-app');

      const result = await executeAgentCliAsync(
        projectRoot,
        ['smoke', '--json', '--platform', 'web'],
        { reject: false }
      );

      expect(result.exitCode).toBe(1);
      const { error } = JSON.parse(result.stdout);
      expect(error.code).toBe('BAD_ARGS');
      expect(error.suggestedCommand).toBe('npx @expo/agent-cli typecheck');
    });
  });

  it('puts the run on the event stream, with every phase', async () => {
    const projectRoot = await setupFixtureAsync('go-app');
    const eventsPath = path.join(projectRoot, 'events.jsonl');

    await executeAgentCliAsync(projectRoot, ['smoke', '--json', '--no-start', '--port', '59120'], {
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
