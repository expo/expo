/* eslint-env jest */
// @ref llp/0022-live-tier.plan.md §live-android: the platform the other suites do not run
// @ref llp/0005-runtime-loop-tools.rfc.md §Android
//
// The Android half of the live tier. Same scaffold and same loop as `live-local`, on a real emulator
// running the real Expo Go APK — and it exists because **Android is where this CLI's honesty is
// load-bearing.** Expo Go for Android ships a Hermes built without the Chrome DevTools Protocol
// debugger [observed — 2026-08-22, corrected 2026-08-25, held 2026-08-27], so five of the seven
// runtime commands cannot answer there at all. What they do instead is the subject of this file.
//
// Three things it pins that no other tier can:
//
//  1. **The refusal, against the real thing.** `e2e/utils.ts`'s `no-debugger` inspector socket is a
//     double for this runtime, and a good one — but it is a double written from a measurement. Here
//     the `-32601` comes from Hermes, and the exit codes come out of the published bundle.
//  2. **The reload rung that works without CDP.** `runtime:reload`'s first rung is a `/message`
//     broadcast verified by peer churn, and Expo Go for Android *does* hold a command-socket client
//     — so the ladder stops on rung 1 here, and the verification is two facts neither of which is a
//     debugger. `live-cloud` proves the opposite case (the broadcast does not reload there).
//  3. **Two platforms on one dev server.** Nothing in `/json/list` names a platform, which is what
//     F51 was, and this suite's mixed-platform block is what found F100, F101 and F105 — three
//     commands that were reading the iOS app while reporting about Android. It runs only when a
//     booted simulator with Expo Go is there too, and it is the reason this file was worth writing.
//
// What green here does *not* claim is in the RUNBOOK, and one line of it belongs at the top: an
// Android emulator is not a phone. Expo Go on a physical device is untested at every tier.

import fs from 'node:fs';
import path from 'node:path';

import {
  allOf,
  androidDeviceGate,
  bootedSimulatorGate,
  builtBinGate,
  EXPO_GO_ANDROID_PACKAGE,
  type AndroidDevice,
  type Simulator,
} from '../prereq';
import {
  LIVE_PORT_BASE,
  LiveRun,
  bootEmulatorAsync,
  execAsync,
  expectExit,
  findFreePortAsync,
  fixturesDir,
  httpStatusAsync,
  looksLikeUncaughtException,
  parseJson,
  runLiveAsync,
  waitForAsync,
} from '../utils';

const androidProbe = androidDeviceGate();
const gate = allOf(builtBinGate(), androidProbe.gate);
const android = androidProbe.device as AndroidDevice;

// The second, *optional* prerequisite, and the only one in this tier whose absence narrows a running
// suite rather than skipping one. The mixed-platform block needs an iOS app on the same dev server;
// everything else is about Android alone.
const simulatorProbe = bootedSimulatorGate();
const simulator = simulatorProbe.simulator as Simulator | null;

/** The port this suite's dev server runs on, chosen in `beforeAll`. @see findFreePortAsync */
let PORT = LIVE_PORT_BASE + 40;

/** The `adb` serial the suite drives. Known only after a boot, so it is filled in by `beforeAll`. */
let SERIAL = '';

const LAB_ROUTE = '/lab';

/** @ref llp/0022 §What a live assertion is allowed to be — a bound, never an expectation. */
const BOUND_MS = 60_000;

/** The refusal every reading command gives on a runtime with no debugger. */
const NO_DEBUGGER_CODE = 'RUNTIME_EVALUATE_UNSUPPORTED';

describeAndroid('live-android: the loop on a real Android emulator', () => {
  const run = new LiveRun('live-android');
  let projectRoot = '';
  let androidNoteFile = '';
  const labSource = fs.readFileSync(path.join(fixturesDir, 'lab', 'lab.tsx'), 'utf8');
  const androidFixtures = path.join(fixturesDir, 'android');

  beforeAll(async () => {
    run.prepare();
    PORT = await findFreePortAsync(LIVE_PORT_BASE + 40);

    // The boot, when there is one. It is here rather than in the gate because a gate is synchronous
    // and this takes tens of seconds — and it is a *failure* rather than a skip when the AVD comes up
    // without Expo Go on it, because by then the suite has already spent the boot. The RUNBOOK says
    // so, and the message says the one command that fixes it.
    if (android.bootAvd) {
      console.log(`[live] booting the emulator ${android.bootAvd}; this takes about 40s`);
      SERIAL = await bootEmulatorAsync(run, android.adb, android.bootAvd);
      const packages = await execAsync(
        android.adb,
        ['-s', SERIAL, 'shell', 'pm', 'list', 'packages'],
        { timeoutMs: 120_000 }
      );
      if (!packages.stdout.includes(EXPO_GO_ANDROID_PACKAGE)) {
        throw new Error(
          `${SERIAL} booted from the AVD ${android.bootAvd} but has no Expo Go on it, so nothing in ` +
            `this suite can run: install it with "npx expo start --android" against any project once, ` +
            `then run this suite again`
        );
      }
    } else {
      SERIAL = android.serial;
    }

    const created = await runLiveAsync(
      run,
      run.tempDir,
      ['new', 'droidlab', '--name', 'Droid Lab', '--json'],
      { label: 'new' }
    );
    run.spend.scaffolds += 1;
    expectExit(created, 0, '@expo/agent-cli new must create and install a project');
    const report = parseJson(created);
    expect(report.created).toBe(true);
    projectRoot = report.projectRoot;

    // The lab screen and its tab trigger, exactly as `live-local` installs them — an insertion into
    // the scaffold's own component rather than a committed copy of it, so a template that changes
    // shape fails loudly here where it is a harness problem.
    fs.writeFileSync(path.join(projectRoot, 'src', 'app', 'lab.tsx'), labSource);
    const tabsFile = path.join(projectRoot, 'src', 'components', 'app-tabs.tsx');
    const tabs = fs.readFileSync(tabsFile, 'utf8');
    const anchor = '</NativeTabs>';
    if (!tabs.includes(anchor)) {
      throw new Error(
        `the scaffold's ${tabsFile} has no ${anchor} to insert the lab tab trigger before — the ` +
          `template changed shape, so this harness needs updating (this is not a finding about the CLI)`
      );
    }
    fs.writeFileSync(
      tabsFile,
      tabs.replace(
        anchor,
        `  <NativeTabs.Trigger name="lab">\n` +
          `        <NativeTabs.Trigger.Label>Lab</NativeTabs.Trigger.Label>\n` +
          `      </NativeTabs.Trigger>\n    ${anchor}`
      )
    );

    // The platform-resolved pair and the route that imports it, for the Android-only break.
    const libDir = path.join(projectRoot, 'src', 'lib');
    fs.mkdirSync(libDir, { recursive: true });
    androidNoteFile = path.join(libDir, 'platform-note.android.ts');
    for (const name of [
      'platform-note.ios.ts',
      'platform-note.android.ts',
      // What `tsc` resolves the import to; Metro uses the platform extensions instead. See the
      // fixture's own comment — without it every `typecheck` row here is TS2307.
      'platform-note.d.ts',
    ]) {
      fs.copyFileSync(path.join(androidFixtures, name), path.join(libDir, name));
    }
    fs.copyFileSync(
      path.join(androidFixtures, 'probe.tsx'),
      path.join(projectRoot, 'src', 'app', 'probe.tsx')
    );

    // Registered before anything needs them, newest-first, so the directory removal runs last.
    // @see LiveRun.onCleanup — a run whose cleanups fired in registration order reported
    // `spawn node ENOENT` for both of them.
    run.onCleanup('scratch project', () => {
      if (!process.env.AGENT_CLI_LIVE_KEEP) {
        fs.rmSync(run.tempDir, { recursive: true, force: true });
      }
    });
    run.onCleanup('runtime:stop --android', async () => {
      await runLiveAsync(run, projectRoot, ['runtime:stop', '--android', '--json'], {
        label: 'cleanup-runtime-stop',
      });
    });
    run.onCleanup('dev:stop', async () => {
      await runLiveAsync(run, projectRoot, ['dev:stop', '--json'], { label: 'cleanup-dev-stop' });
      const freed = await waitForAsync(
        async () => (await httpStatusAsync(`http://127.0.0.1:${PORT}/status`)) === 0,
        30_000
      );
      if (!freed) {
        throw new Error(`something still answers on port ${PORT} after dev:stop`);
      }
    });
  }, 600_000);

  afterAll(async () => {
    await run.cleanUpAsync();
    console.log(run.costLine());
  });

  /** Whether Expo Go has a process on the emulator right now, asked of the device rather than of us. */
  async function expoGoIsRunningAsync(): Promise<boolean> {
    const probe = await execAsync(
      android.adb,
      ['-s', SERIAL, 'shell', 'pidof', EXPO_GO_ANDROID_PACKAGE],
      { timeoutMs: 60_000 }
    );
    return /^\d[\d\s]*$/.test(probe.stdout.trim());
  }

  /**
   * Wait until the emulator has no Expo Go process, and say whether it got there.
   *
   * A bound rather than a read, because **`am force-stop` is asynchronous** [observed — the second
   * run of this suite, 2026-08-27]: the `adb shell` exits 0 as soon as ActivityManager has taken the
   * request, and `pidof` still answers a pid for a moment afterwards. So `runtime:stop`'s claim is
   * "the stop ran, and the app was running before it" — which is what the report says — and the
   * *effect* is a fact about the device a beat later. Asserting the effect instantly would be
   * asserting a timing, which llp/0022 §What a live assertion is allowed to be rules out.
   */
  async function waitForExpoGoStoppedAsync(): Promise<boolean> {
    return waitForAsync(async () => !(await expoGoIsRunningAsync()), 30_000, 1_000);
  }

  /**
   * Wait until an Android runtime on this dev server can be *connected to*, and say whether it can.
   *
   * The precondition `live-local` needs `waitForLabScreenAsync` for, and it cannot be the same one:
   * that helper polls `runtime:tree`, which is the first thing Expo Go for Android refuses. What can
   * be polled here is `runtime:errors` with a zero-length window — the one reading command that
   * connects on Android — and what it establishes is exactly the two facts a gate needs before it is
   * asked anything: a target is listed **and** something is behind it.
   *
   * The second half is why a listed target is not enough. A reload leaves the pre-reload page in
   * `/json/list` for a second or two with nothing behind it (F56, and F39's mechanism), so `smoke`'s
   * `app` phase says `ok` from the list while its `runtime` phase answers `No target found.` from the
   * socket — which is correct, and is not what a test about the no-debugger wall is asking [observed —
   * the fourth run of this suite, 2026-08-27].
   */
  async function waitForAndroidRuntimeAsync(label: string): Promise<boolean> {
    return waitForAsync(
      async () => {
        const probe = await runLiveAsync(
          run,
          projectRoot,
          ['runtime:errors', '--android', '--duration', '0s', '--json'],
          { label: `await-runtime-${label}` }
        );
        if (probe.exitCode !== 0) {
          return false;
        }
        // `false` and not null: the window connected far enough for the runtime to say what it is.
        return parseJson(probe).runtimeReadable === false;
      },
      BOUND_MS,
      2_000
    );
  }

  /** Every debugger target the dev server lists, with the device name that places its platform. */
  async function listedTargetsAsync(): Promise<{ deviceName: string; appId: string }[]> {
    const listed = await execAsync(
      'curl',
      ['-sS', '-m', '20', `http://127.0.0.1:${PORT}/json/list`],
      { timeoutMs: 40_000 }
    );
    try {
      return JSON.parse(listed.stdout);
    } catch {
      return [];
    }
  }

  // --- the dev server, and getting the app onto the emulator --------------------------------------

  it('dev --plan --android plans the Expo Go path and offers to run the plan it printed', async () => {
    const result = await runLiveAsync(run, projectRoot, ['dev', '--plan', '--android', '--json'], {
      label: 'dev-plan-android',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.target).toBe('expo-go');
    expect(report.steps[0].argv).toEqual(['expo', 'start', '--go', '--android']);
    // F103: the one follow-up whose promise is "runs the plan above" has to ask for the same plan.
    // Without the flag it plans for iOS on this host, which is a different plan than the one printed.
    const dev = report.followups.find((followup: any) => followup.id === 'dev');
    expect(dev.command).toBe('npx @expo/agent-cli dev --android');
  });

  it('dev --detach --wait-ready starts a server that is still there afterwards', async () => {
    const result = await runLiveAsync(
      run,
      projectRoot,
      ['dev', '--detach', '--wait-ready', '--port', String(PORT), '--json'],
      { label: 'dev-detach' }
    );
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.ready).toBe(true);
    expect(report.port).toBe(PORT);
    expect(await httpStatusAsync(`http://127.0.0.1:${PORT}/status`)).toBe(200);
  });

  it('status lists the emulator, not only the first device this host probes', async () => {
    const result = await runLiveAsync(run, projectRoot, ['status', '--json'], { label: 'status' });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.device.state).toBe('present');
    // F106 — the whole finding in one assertion. iOS is probed first on macOS, so on a machine with a
    // booted simulator this section named the simulator and never mentioned the emulator, on a run
    // whose only connected app was on the emulator. The singular fields are still the first device.
    const serials = report.device.devices.map((device: any) => device.deviceId);
    expect(serials).toContain(SERIAL);
    const emulator = report.device.devices.find((device: any) => device.deviceId === SERIAL);
    expect(emulator.platform).toBe('android');
  });

  it('typecheck and doctor answer about the project, whatever platform is attached', async () => {
    // The generated types exist now: `expo start` wrote `expo-env.d.ts`, which is F64's live half and
    // `live-local`'s subject. Here it is the precondition, and the claim is that these two commands
    // have no platform dimension at all.
    expect(fs.existsSync(path.join(projectRoot, 'expo-env.d.ts'))).toBe(true);
    const typecheck = await runLiveAsync(run, projectRoot, ['typecheck', '--json'], {
      label: 'typecheck',
    });
    expectExit(typecheck, 0);
    expect(parseJson(typecheck).errorCount).toBe(0);

    const doctor = await runLiveAsync(run, projectRoot, ['doctor', '--json'], { label: 'doctor' });
    expect([0, 20]).toContain(doctor.exitCode);
    const report = parseJson(doctor);
    expect(report.parse).toBe('full');
    expect(report.checks.length).toBeGreaterThan(15);
  });

  it('navigate reverses the port, opens the route on the emulator, and waits for the attach', async () => {
    const result = await runLiveAsync(
      run,
      projectRoot,
      ['navigate', LAB_ROUTE, '--android', '--json'],
      { label: 'navigate-lab' }
    );
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.deviceBackend).toBe('local-android');
    expect(report.deviceId).toBe(SERIAL);
    expect(report.url).toBe(`exp://127.0.0.1:${PORT}/--${LAB_ROUTE}`);
    expect(report.routeCheck.ok).toBe(true);

    // F50, and the reason this row is the highest-value one on Android: `exp://127.0.0.1` names the
    // loopback of whatever resolves it, which on an emulator is the emulator. Without the reverse the
    // manifest fetch reaches a port nothing listens on, Expo Go shows `ErrorActivity`, and
    // `adb shell am start` still exits 0 — so the command reported success for an error screen.
    expect(report.reversedPort).toBe(PORT);
    // F50's other half: an exit code from a device tool is not an app that is running.
    expect(report.attached).toBe(true);

    // F49: the `adb` in the command is the one that was resolved, never the bare name a machine
    // without `platform-tools` on PATH cannot execute.
    expect(report.command).toContain(android.adb);

    // F104: the screenshot follow-up may not tell an Android caller to wait on `runtime:tree`, which
    // needs the debugger this runtime has not got.
    const screenshot = report.followups.find((followup: any) => followup.id === 'screenshot');
    expect(screenshot.why).not.toContain('run "npx @expo/agent-cli runtime:tree" first');
    expect(screenshot.why).toContain('npx @expo/agent-cli smoke --android');
  });

  it('dev:logs carries the Android bundle the emulator asked for', async () => {
    const result = await runLiveAsync(run, projectRoot, ['dev:logs', '--json'], {
      label: 'dev-logs',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(fs.existsSync(report.logFile)).toBe(true);
    // The bundler's own line, which names the platform the dev server actually served.
    expect(report.lines.join('\n')).toContain('Android Bundled');
  });

  // --- the wall: five commands that cannot answer, and refuse -------------------------------------

  // @ref llp/0005 §The CDP-less runtime, corrected — and `e2e/utils.ts`'s `no-debugger` socket, which
  // is the double for exactly this. The stub tier pins the *shape*; these rows pin that Hermes really
  // answers this way, in the published bundle, on this SDK.
  //
  // Exit **1** and not 20, and that is the band that matters (llp/0010 §Exit codes): nothing was
  // attempted, so there is no outcome to report — 20 would say the app was read and found wanting.
  it.each([
    ['runtime:eval', ['runtime:eval', '1 + 1', '--android', '--json']],
    ['runtime:tree', ['runtime:tree', '--android', '--json']],
    ['runtime:tap', ['runtime:tap', 'inc-btn', '--android', '--json']],
    ['runtime:type', ['runtime:type', 'x', '--testID', 'name-input', '--android', '--json']],
  ])('%s refuses on Expo Go for Android, and names the wall', async (name, argv) => {
    const result = await runLiveAsync(run, projectRoot, argv as string[], {
      label: `no-debugger-${name.replace(':', '-')}`,
    });
    expectExit(result, 1, `${name} must refuse rather than answer from a runtime that cannot answer`);
    const report = parseJson(result);
    expect(report.error.code).toBe(NO_DEBUGGER_CODE);
    // What / why / how, and the why has to be the real cause rather than "the app did not answer":
    // no retry and no longer timeout makes this work, so a message that implied one would be a trap.
    expect(report.error.message).toContain('Expo Go for Android');
    expect(report.error.message).toContain('Chrome DevTools Protocol');
    expect(report.error.message).not.toMatch(/--timeout/);
    // The one command that does answer here, with the flag this run had.
    expect(report.error.suggestedCommand).toBe('npx @expo/agent-cli runtime:errors --android');
  });

  it('runtime:errors reports the window as untrusted and falls back to the dev server log', async () => {
    const result = await runLiveAsync(
      run,
      projectRoot,
      ['runtime:errors', '--android', '--duration', '3s', '--json'],
      { label: 'errors-blind' }
    );
    // Exit 0 without the gate flag: the command was asked to watch and it watched. The caveat is what
    // carries the fact that watching established nothing (llp/0005 §--fail-on-error on a runtime that
    // cannot answer).
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.runtimeReadable).toBe(false);
    expect(report.runtimeEvidence).toContain('does not support debugging over the Chrome DevTools');
    expect(report.untrusted).toContain('errors');
    // F52: the channel was never missing, only the one it was read from. A detached dev server has a
    // log, and that log is where a bridgeless Android app's errors arrive.
    expect(report.devServerLog.read).toBe(true);
    expect(fs.existsSync(report.devServerLog.logFile)).toBe(true);
    // F103: both commands named carry the platform this window was about.
    const commands = report.followups.map((followup: any) => followup.command);
    expect(commands).toContain('npx @expo/agent-cli runtime:errors --android --duration 6000');
  });

  it('runtime:errors --fail-on-error exits 20 for an error the log caught inside the window', async () => {
    const labFile = path.join(projectRoot, 'src', 'app', 'lab.tsx');
    const thrown = 'W25 live-android check';
    try {
      // The error has to arrive *inside* the window: the log is cumulative and the read is bounded by
      // a mark taken before the window opens, so a throw from before it is counted as `older` and is
      // correctly not this window's. Writing the file mid-window is what Fast Refresh turns into one.
      const watching = runLiveAsync(
        run,
        projectRoot,
        ['runtime:errors', '--android', '--fail-on-error', '--duration', '15s', '--json'],
        { label: 'errors-fail-on-error' }
      );
      await new Promise((resolve) => setTimeout(resolve, 3_000));
      fs.writeFileSync(
        labFile,
        labSource.replace(
          '  const [count, setCount] = useState(0);',
          `  const [count, setCount] = useState(0);\n  throw new Error('${thrown}');`
        )
      );
      const result = await watching;

      // 20, not 0: an error was observed, and this is the first channel on Android that can observe
      // one at all [llp/0005 §Reading Android errors anyway].
      expectExit(result, 20, 'an error the log caught in the window is an outcome, not silence');
      const report = parseJson(result);
      expect(report.count).toBeGreaterThan(0);
      const caught = report.errors.find((error: any) => String(error.message).includes(thrown));
      expect(caught).toBeDefined();
      expect(caught.source).toBe('dev-server-log');
      // The dev server has already resolved the file and line, which is what makes this usable: there
      // is no structured stack behind a log record, and this is what there is instead.
      expect(JSON.stringify(caught)).toContain('lab.tsx');
    } finally {
      fs.writeFileSync(labFile, labSource);
      await runLiveAsync(run, projectRoot, ['runtime:reload', '--android', '--json'], {
        label: 'reload-after-throw',
      });
    }
  }, 120_000);

  it('a gate with no window and no log exits 22, never 0', async () => {
    // The state of every project whose dev server was started in the foreground: there is no detached
    // log, so the fallback has nothing to read and the blind window is *no observation*. Reproduced by
    // moving this run's log aside rather than by starting a second dev server, and restored after —
    // the file is the only difference between the two states, and `readDetachedLogSync` is what reads
    // it. @ref llp/0005 §`--fail-on-error` on a runtime that cannot answer.
    const logFile = path.join(projectRoot, '.expo', 'dev', 'logs', 'dev-detached.log');
    const parked = `${logFile}.parked`;
    fs.renameSync(logFile, parked);
    try {
      const result = await runLiveAsync(
        run,
        projectRoot,
        ['runtime:errors', '--android', '--fail-on-error', '--duration', '2s', '--json'],
        { label: 'errors-inconclusive' }
      );
      // 22 is llp/0010's "nothing was shown to be wrong and nothing was proved right". The exit-code
      // table's rule that the `no-debugger` stub pins, now against the runtime it was written from.
      expectExit(result, 22, 'a gate given no observation must not report health');
      expect(result.exitCode).not.toBe(0);
      const report = parseJson(result);
      expect(report.runtimeReadable).toBe(false);
      expect(report.devServerLog.read).toBe(false);
      expect(report.devServerLog.reason).toContain('--detach');
    } finally {
      fs.renameSync(parked, logFile);
    }
  });

  // --- the reload rung that needs no debugger -----------------------------------------------------

  it('runtime:reload stops on the command-socket rung, verified by two facts and no CDP', async () => {
    const result = await runLiveAsync(run, projectRoot, ['runtime:reload', '--android', '--json'], {
      label: 'reload-android',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.reloaded).toBe(true);

    // Rung 1 of the wave-21/23 ladder: the dev server's own `/message` broadcast. Expo Go for Android
    // **does** hold a client on that socket — measured here rather than assumed — so the ladder never
    // reaches the device relaunch, which is the rung `live-cloud` is forced onto.
    expect(report.method).toBe('dev-server');
    expect(report.attempts).toHaveLength(1);
    expect(report.attempts[0].method).toBe('dev-server');
    expect(report.commandSocketClients).toBeGreaterThan(0);

    // @ref llp/0005 §Peer churn proves the app acted. The verification is honest without CDP because
    // neither of its two facts is a debugger: the app's socket id changed (the dev server's id counter
    // does not rewind, so a peer under a new id is a new connection), and the dev server served a
    // bundle for **android**.
    expect(report.verifiedBy).toBe('message-socket-peers');
    expect(report.commandSocketChurn.observed).toBe(true);
    expect(report.commandSocketChurn.reconnected).toBeGreaterThan(0);
    expect(report.bundle.platform).toBe('android');
    if (report.bundlesAfterReload.observed) {
      expect(report.bundlesAfterReload.line).toContain('Android');
    }

    // And the count that a debugger *would* have supplied is never a bare zero: the two watches race
    // on one budget, so which answers first is a property of the moment, and a zero says which fact
    // it is (F95).
    if (report.appsReconnected === 0) {
      expect(report.appsReconnectedReason).toBeTruthy();
    }

    // F103: the follow-ups keep the platform, including the reading command that can answer here.
    const commands = report.followups.map((followup: any) => followup.command);
    expect(commands).toContain('npx @expo/agent-cli runtime:errors --android --fail-on-error');
  });

  it('runtime:reload --route checks the route and opens it on the emulator', async () => {
    const result = await runLiveAsync(
      run,
      projectRoot,
      ['runtime:reload', '--android', '--route', LAB_ROUTE, '--json'],
      { label: 'reload-route-android' }
    );
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.reloaded).toBe(true);
    expect(report.routeCheck.ok).toBe(true);
    expect(report.routeCheck.matched).toBe(LAB_ROUTE);
  });

  // --- the gate, and which of its phases can pass here --------------------------------------------

  it('smoke --android passes what it can prove and refuses to decide the rest', async () => {
    // The wait comes first, and it has to: the reload above left the pre-reload page listed for a
    // moment with nothing behind it, and this gate's `runtime` phase answered `No target found.`
    // rather than the no-debugger sentence. Both are honest 22s and only one is this test's subject.
    expect(await waitForAndroidRuntimeAsync('before-smoke')).toBe(true);

    const result = await runLiveAsync(run, projectRoot, ['smoke', '--android', '--json'], {
      label: 'smoke-android',
    });
    // **22 and not 0**, on a working app, and that is the honest answer rather than a defect: the
    // `runtime` phase cannot measure, and llp/0010 §The sixth says a gate that cannot measure must not
    // pass. `smoke --android` is therefore not a green light on Expo Go — it is four proofs and two
    // abstentions, and the report says which is which.
    expectExit(result, 22, 'a gate that cannot read the runtime must not report a pass');
    const report = parseJson(result);
    expect(report.ok).toBe(false);
    expect(report.outcome).toBe('inconclusive');

    const status = Object.fromEntries(report.phases.map((phase: any) => [phase.id, phase.status]));
    // What Android *can* prove: the dev server, the bundler, the entry bundle for this platform, an
    // app connected on this platform, and a picture of the screen.
    expect(status['dev-server']).toBe('ok');
    expect(status['bundler-ready']).toBe('ok');
    expect(status.bundle).toBe('ok');
    expect(status.app).toBe('ok');
    expect(status.screenshot).toBe('ok');
    // What it cannot, with a reason naming the cause rather than the symptom.
    expect(status.runtime).toBe('inconclusive');
    expect(status.errors).toBe('inconclusive');
    const reasons = Object.fromEntries(report.phases.map((p: any) => [p.id, p.reason]));
    expect(reasons.runtime).toContain('no debugger');
    expect(report.runtimeSupported).toBe(false);
    expect(report.untrusted).toContain('errors.records');

    // The device it earned its verdict on, which is the field F51 was found in.
    expect(report.platform).toBe('android');
    expect(report.deviceBackend).toBe('local-android');
    expect(report.deviceId).toBe(SERIAL);

    // A screenshot through `adb exec-out screencap` is a file on this machine or it is not one. F57:
    // this is a run that did not open the app itself, so nothing was mid-load.
    expect(report.screenshot.platform).toBe('android');
    expect(fs.existsSync(report.screenshot.path)).toBe(true);
    expect(fs.statSync(report.screenshot.path).size).toBeGreaterThan(1000);

    // F58: every command the failure suggests carries the platform of the run — except the one whose
    // whole point is the other platform, which names it.
    for (const followup of report.followups) {
      if (followup.command.startsWith('npx @expo/agent-cli smoke')) {
        expect(followup.command).toMatch(/--(android|ios)\b/);
      }
    }
  }, 120_000);

  // --- the platform default must not answer for the other platform --------------------------------

  describe('an Android-only break', () => {
    beforeAll(async () => {
      fs.copyFileSync(
        path.join(androidFixtures, 'platform-note.android.ts.broken'),
        androidNoteFile
      );
      // Give Metro a moment to notice the write before a gate asks it to build.
      await new Promise((resolve) => setTimeout(resolve, 3_000));
    });

    afterAll(async () => {
      fs.copyFileSync(path.join(androidFixtures, 'platform-note.android.ts'), androidNoteFile);
      await new Promise((resolve) => setTimeout(resolve, 3_000));
      await runLiveAsync(run, projectRoot, ['runtime:reload', '--android', '--json'], {
        label: 'reload-after-android-fix',
      });
    });

    it('smoke --android fails at the bundle and skips what it cannot reach', async () => {
      const result = await runLiveAsync(run, projectRoot, ['smoke', '--android', '--json'], {
        label: 'smoke-android-broken',
      });
      expectExit(result, 20, 'a bundle that does not compile is a failure, not an abstention');
      const report = parseJson(result);
      expect(report.outcome).toBe('failed');
      const status = Object.fromEntries(report.phases.map((p: any) => [p.id, p.status]));
      expect(status.bundle).toBe('failed');
      expect(status.app).toBe('skipped');
      expect(status.runtime).toBe('skipped');
      expect(JSON.stringify(report.bundle.error)).toContain('platform-note.android.ts');
    }, 120_000);

    // F53, live, and the assertion that tells "checked the right platform" from "checked something":
    // the break is on **Android only**, and a no-flag run used to build for the host default (iOS),
    // pass, and reload the Android app onto the bundle that does not compile — printing
    // `Bundle compiles · for ios` while doing it.
    it('runtime:reload with no flag refuses, because the platform comes from the connected app', async () => {
      const result = await runLiveAsync(run, projectRoot, ['runtime:reload', '--json'], {
        label: 'reload-no-flag-broken',
      });
      expectExit(result, 20, 'the platform the app is on decides the run, not the host default');
      const report = parseJson(result);
      expect(report.reloaded).toBe(false);
      expect(report.bundlePlatforms).toContain('android');
      expect(report.bundlePlatformSource).toBe('connected-app');
      expect(report.bundle.ok).toBe(false);
      expect(report.bundle.platform).toBe('android');
    }, 120_000);

    it('dev:logs carries the bundler error the gates refused on', async () => {
      const result = await runLiveAsync(run, projectRoot, ['dev:logs', '--json'], {
        label: 'dev-logs-broken',
      });
      expectExit(result, 0);
      expect(parseJson(result).lines.join('\n')).toContain('platform-note.android.ts');
    });
  });

  // --- two platforms on one dev server -----------------------------------------------------------

  // The block that found F100, F101 and F105, and the one no other suite in this tier can run:
  // `/json/list` names no platform (llp/0005 §The dev server does not label its targets), and the
  // default target selector ranks a runtime that *answers* above one that answers `-32601` — so on a
  // machine with both, every unscoped read lands on iOS **by design**. Three commands were unscoped.
  //
  // Conditional rather than gated: an Android-only machine still runs everything above.
  (simulator ? describe : describe.skip)('with an iOS app on the same dev server', () => {
    beforeAll(async () => {
      const opened = await runLiveAsync(
        run,
        projectRoot,
        ['navigate', LAB_ROUTE, '--ios', '--json'],
        { label: 'navigate-ios-for-mixed' }
      );
      expectExit(opened, 0, 'the mixed-platform block needs the app open on the simulator too');
      const both = await waitForAsync(async () => {
        const targets = await listedTargetsAsync();
        return (
          targets.some((target) => target.deviceName?.includes('iPhone')) &&
          targets.some((target) => / - .+ - API \d+$/.test(target.deviceName ?? ''))
        );
      }, BOUND_MS, 2_000);
      if (!both) {
        throw new Error(
          `the dev server never listed an app on both platforms at once, so this block has nothing ` +
            `to tell apart. Listed: ${JSON.stringify(await listedTargetsAsync())}`
        );
      }
    }, 180_000);

    afterAll(async () => {
      // The simulator is left as it was found, minus the app this block opened.
      await runLiveAsync(run, projectRoot, ['runtime:stop', '--ios', '--json'], {
        label: 'cleanup-runtime-stop-ios',
      });
    });

    // F100 — CRITICAL. `CdpRuntimeErrorCollector` accepted `platform` and dropped it when it built
    // its `CdpClient`, so this command read whichever runtime the selector preferred. Live, in one
    // minute [observed — 2026-08-27]: `runtime:eval --android` refused with
    // `RUNTIME_EVALUATE_UNSUPPORTED` while `runtime:errors --android` answered
    // `runtimeReadable: true` and returned an error whose own text was `W25 boom on ios`.
    //
    // The assertion is the *disagreement being gone*: the two flags must describe two runtimes.
    it('runtime:errors reads the platform it was told, not the one that answers (F100)', async () => {
      const onAndroid = await runLiveAsync(
        run,
        projectRoot,
        ['runtime:errors', '--android', '--duration', '3s', '--json'],
        { label: 'mixed-errors-android' }
      );
      expectExit(onAndroid, 0);
      const fromAndroid = parseJson(onAndroid);
      expect(fromAndroid.runtimeReadable).toBe(false);
      expect(fromAndroid.runtimeEvidence).toContain('Chrome DevTools Protocol');

      const onIos = await runLiveAsync(
        run,
        projectRoot,
        ['runtime:errors', '--ios', '--duration', '3s', '--json'],
        { label: 'mixed-errors-ios' }
      );
      expectExit(onIos, 0);
      const fromIos = parseJson(onIos);
      // The same dev server, the same minute, the other flag: a runtime that does answer.
      expect(fromIos.runtimeReadable).toBe(true);
      expect(fromIos.devServerLog.read).toBe(false);
    }, 120_000);

    // F105 — the other half of F100, and the one that cannot be fixed by scoping. The dev server log
    // is not a per-app channel: Expo's logger prefixes a platform only for an app that is not
    // bridgeless, and every modern app is. So the fallback's records may be either app's, and the
    // report has to say so rather than call them "this app's errors".
    it('the log fallback names the other platform whose app writes to the same log (F105)', async () => {
      const result = await runLiveAsync(
        run,
        projectRoot,
        ['runtime:errors', '--android', '--duration', '2s', '--json'],
        { label: 'mixed-errors-log-caveat' }
      );
      expectExit(result, 0);
      const report = parseJson(result);
      expect(report.devServerLog.read).toBe(true);
      expect(report.devServerLog.otherPlatformsConnected).toEqual(['ios']);

      const printed = await runLiveAsync(
        run,
        projectRoot,
        ['runtime:errors', '--android', '--duration', '2s'],
        { label: 'mixed-errors-log-caveat-text' }
      );
      expectExit(printed, 0);
      expect(printed.all).toContain('does not say which app wrote a line');
      expect(printed.all).not.toContain("where this app's errors do arrive");
    }, 120_000);

    // F101 — CRITICAL, and the one that was silent. `resolveAppId` took the first application id the
    // dev server listed, and Expo Go's two ids differ by one capital letter — so `runtime:stop
    // --android` ran `am force-stop host.exp.Exponent` on the emulator. That is not an installed
    // package there; `am force-stop` exits 0 and prints nothing, so the command reported
    // `stopped: true, wasRunning: true` while `pidof host.exp.exponent` still answered `3933`.
    it('runtime:stop --android stops the Android app, and can show that it did (F101, F102)', async () => {
      const targets = await listedTargetsAsync();
      expect(targets.map((target) => target.appId)).toContain('host.exp.Exponent');
      expect(await expoGoIsRunningAsync()).toBe(true);

      const result = await runLiveAsync(run, projectRoot, ['runtime:stop', '--android', '--json'], {
        label: 'mixed-stop-android',
      });
      expectExit(result, 0);
      const report = parseJson(result);
      // Android's own spelling, with the iOS one listed beside it on the dev server.
      expect(report.bundleId).toBe(EXPO_GO_ANDROID_PACKAGE);
      expect(report.command).toContain(EXPO_GO_ANDROID_PACKAGE);
      expect(report.connectedAppIds).not.toContain('host.exp.Exponent');
      expect(report.deviceId).toBe(SERIAL);

      // F102: `wasRunning` is an observation now — `am force-stop` says nothing either way, so the
      // command asks `pidof` before it stops. And the claim is checked against the device rather than
      // taken from the report: the assertion above this call established the app *was* running, and
      // the wait below establishes that it is not any more.
      expect(report.wasRunning).toBe(true);
      expect(await waitForExpoGoStoppedAsync()).toBe(true);

      // F103: the way back is to the device this stop acted on.
      expect(report.followups[0].command).toBe('npx @expo/agent-cli navigate / --android');
    }, 120_000);
  });

  // --- stopping ----------------------------------------------------------------------------------

  it('runtime:stop is a success for an app that is already stopped, and says nothing ran', async () => {
    // llp/0010 §The seventh and eighth: the subject of this command is a *state*, so an agent that
    // stops an app twice must not have to special-case the second run. The wait comes first and has
    // to: `am force-stop` is asynchronous, so "already stopped" is only true once the device has
    // caught up with the stop the block above asked for.
    await runLiveAsync(run, projectRoot, ['runtime:stop', '--android', '--json'], {
      label: 'stop-android-first',
    });
    expect(await waitForExpoGoStoppedAsync()).toBe(true);

    const result = await runLiveAsync(run, projectRoot, ['runtime:stop', '--android', '--json'], {
      label: 'stop-android-repeat',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.stopped).toBe(true);
    expect(report.bundleId).toBe(EXPO_GO_ANDROID_PACKAGE);
    // F102's other half, and the value of the `pidof` probe: `wasRunning` used to be `true` here as
    // well — on a device with no such process at all — because `am force-stop` exits 0 either way.
    expect(report.wasRunning).toBe(false);
  }, 120_000);

  it('dev:stop ends the dev server it started, and the port is free after', async () => {
    const result = await runLiveAsync(run, projectRoot, ['dev:stop', '--json'], {
      label: 'dev-stop',
    });
    const freed = await waitForAsync(
      async () => (await httpStatusAsync(`http://127.0.0.1:${PORT}/status`)) === 0,
      30_000
    );
    expect(freed).toBe(true);

    // F94's trigger is on this machine and fires on roughly half of runs, from inside undici. Either
    // a report or the crash report — a third outcome is a new finding. @see the RUNBOOK.
    if (!looksLikeUncaughtException(result)) {
      expectExit(result, 0);
      const report = parseJson(result);
      expect(report.stopped).toBe(true);
      expect(report.portStillAnswering).toBe(false);
    } else {
      expect(result.exitCode).not.toBe(7);
      console.log(
        `[live] F94's trigger fired on dev:stop and was reported as a tool error (exit ` +
          `${result.exitCode}). Evidence: ${result.artifact}`
      );
    }
  });
});

/**
 * `describe` or `describe.skip`, with the reason printed either way.
 *
 * A local re-spelling of `describeLive` so the gate reason can also name the *optional* prerequisite
 * this suite narrows itself on: a reader of a green run has to be able to tell a 24-test run from a
 * 20-test one without counting.
 */
function describeAndroid(name: string, body: () => void): void {
  if (!gate.ok) {
    console.log(`[live] SKIPPED live-android: ${gate.reason}`);
    describe.skip(name, body);
    return;
  }
  console.log(
    simulator
      ? `[live] live-android: running the mixed-platform block too — ${simulator.name} is booted with Expo Go on it`
      : '[live] live-android: SKIPPING the mixed-platform block — no booted iOS simulator with Expo Go, ' +
          'so nothing here can tell a scoped read from an unscoped one (F100, F101, F105)'
  );
  describe(name, body);
}
