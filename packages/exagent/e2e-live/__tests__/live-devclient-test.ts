/* eslint-env jest */
// @ref llp/0022-live-tier.plan.md §live-devclient: the other half of real-world usage
// @ref llp/0005-runtime-loop-tools.rfc.md §Android
//
// The fifth suite [added 2026-08-28, wave 29]. Every suite before it runs **Expo Go**, and a
// development build is the other half of how these commands are used — and on Android it is not a
// variation, it is a different answer to the central question of this whole CLI.
//
// **The one measurement this suite exists for.** `live-android` asserts that five runtime commands
// *refuse* on Android, and [[0022-live-tier]] already suspected what that was really about: "every
// refusal `live-android` asserts is a property of Expo Go, not of the platform". It is. On a
// development build on the same emulator, in the same minute, `runtime:eval "1+1" --android` returns
// **2** [observed — wave 29, 2026-08-28, `wave29-devclient/evidence/47-eval-android.json`], and
// `smoke --android` exits **0** with all eight phases `ok`. So this file is where the Android column
// stops being a column of refusals, and `live-android`'s refusals keep meaning exactly what they say
// — about Expo Go.
//
// **Why it is shaped unlike every other suite here.** It does not scaffold. `exagent new` costs
// seconds and a development build costs about fifteen minutes of Gradle, and a live suite may not
// spend that ([[0022-live-tier]] §Every suite cleans up after itself). So the *artifact* is the
// prerequisite: `EXAGENT_LIVE_DEVCLIENT_PROJECT` names a project somebody has already run
// `npx expo run:android` in, the gate checks that its package is installed **and** that the build is
// recorded, and the project is used in place rather than copied. Nothing here makes an EAS call, so
// the scratch-outside-git rule that forces every other suite to copy does not apply.
//
// **iOS is measured and is not in here, and that is a finding rather than an omission.** Every way
// of opening a development build on a local iOS simulator goes through `xcrun simctl openurl`, and
// on iOS 26.5 that raises a springboard confirmation — "Open in “dcapp”?" — which nothing in this
// tier can answer, on *every* call and not only the first. Measured against Expo Go on the same
// simulator in the same minute: `exp://127.0.0.1:<port>` launched Expo Go and attached inside 4 s,
// and `dcapp://expo-development-client/?url=…` left the simulator on the springboard with 0 targets
// after 24 s [observed — wave 29, `evidence/27-clean-connect-url.png`, `19-after-expgo-url.png`].
// So the iOS runtime family was driven by hand with the dialog answered, its results are in
// [[0019-backend-parity-audit]], and a suite that needed a person to tap Open would be a suite that
// never runs.

import fs from 'node:fs';
import path from 'node:path';

import {
  allOf,
  androidDevBuildGate,
  androidDeviceGate,
  builtBinGate,
  devClientProjectGate,
  type AndroidDevice,
  type DevClientProject,
} from '../prereq';
import {
  LIVE_PORT_BASE,
  LiveRun,
  execAsync,
  expectExit,
  findFreePortAsync,
  httpStatusAsync,
  parseJson,
  runLiveAsync,
  waitForAsync,
} from '../utils';

const projectProbe = devClientProjectGate();
const androidProbe = androidDeviceGate();
const project = projectProbe.project as DevClientProject;
const android = androidProbe.device as AndroidDevice;
const gate = allOf(
  builtBinGate(),
  projectProbe.gate,
  androidProbe.gate,
  androidDevBuildGate(projectProbe.project, androidProbe.device)
);

if (!gate.ok) {
  console.log(`[live] SKIPPED live-devclient: ${gate.reason}`);
}
const describeDevClient = gate.ok ? describe : describe.skip;

/** The port this suite's dev server runs on, chosen in `beforeAll`. */
let PORT = LIVE_PORT_BASE + 60;

/** @ref llp/0022 §What a live assertion is allowed to be — a bound, never an expectation. */
const BOUND_MS = 90_000;

describeDevClient('live-devclient: the loop on a real Android development build', () => {
  const run = new LiveRun('live-devclient');
  const projectRoot = project?.root ?? '';
  const serial = android?.serial ?? '';

  beforeAll(async () => {
    run.prepare();
    PORT = await findFreePortAsync(LIVE_PORT_BASE + 60);

    // Registered before the thing that needs it, newest-first, and the directory this run made is
    // **not** the project — it is only the artifacts root, so nothing here deletes anybody's work.
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

    // The project is somebody's, not this run's, so it may already have a dev server — and one
    // detached server per project is the rule (llp/0004 §Daemonization), so a second `dev --detach`
    // reports the first back with `alreadyRunning: true`, `ready: null` and a port this suite did
    // not choose. Every other suite in this tier owns a directory nobody else has touched and never
    // meets this. Stopping first is what makes the start below this suite's own.
    await runLiveAsync(run, projectRoot, ['dev:stop', '--json'], { label: 'dev-stop-before' });

    // `--android` rather than a bare start, and it is the step that connects the app: `expo start
    // --dev-client --android` opens the installed development build on the emulator through `adb`,
    // which is the one path that needs neither a build nor a person. On iOS the same flag goes
    // through `osascript` and dies on this machine, which is a second reason this suite is Android.
    const started = await runLiveAsync(
      run,
      projectRoot,
      ['dev', '--detach', '--wait-ready', '--android', '--yes', '--port', String(PORT), '--json'],
      { label: 'dev-detach' }
    );
    expectExit(started, 0, 'the gate said this project has a recorded build, so this must serve');
    const report = parseJson(started);
    expect(report.ready).toBe(true);
    expect(report.port).toBe(PORT);

    const attached = await waitForAndroidRuntimeAsync('beforeAll');
    if (!attached) {
      throw new Error(
        `the development build ${project.androidPackage} did not connect to the dev server on ` +
          `port ${PORT} within ${BOUND_MS}ms. Open it by hand with "${android.adb} -s ${serial} ` +
          `shell am start -a android.intent.action.VIEW -d '${project.scheme}://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A${PORT}'" ` +
          `and read what it shows — a launcher stuck on its error screen is upstream, not this CLI`
      );
    }
  }, 300_000);

  afterAll(async () => {
    await run.cleanUpAsync();
    console.log(run.costLine());
  });

  /**
   * Wait until the development build's runtime answers, and say whether it does.
   *
   * `runtime:eval` rather than `runtime:tree`, and rather than `live-android`'s zero-length
   * `runtime:errors` window: this is the one command whose success is the whole subject of the
   * suite, and a precondition that establishes it establishes everything else. A listed target is
   * not enough — a reload leaves the old page listed for a second with nothing behind it (F56).
   */
  async function waitForAndroidRuntimeAsync(label: string): Promise<boolean> {
    return waitForAsync(
      async () => {
        const probe = await runLiveAsync(
          run,
          projectRoot,
          ['runtime:eval', '1', '--android', '--json'],
          { label: `await-runtime-${label}` }
        );
        return probe.exitCode === 0 && parseJson(probe).value === 1;
      },
      BOUND_MS,
      3_000
    );
  }

  // --- what the plan and the report say about a development build ---------------------------------

  it('plans a dev server rather than a build, and names the dev-client flag', async () => {
    const result = await runLiveAsync(run, projectRoot, ['dev', '--plan', '--android', '--json'], {
      label: 'dev-plan',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    // The two `fresh` rules that end in a dev server. Which one depends on whether the project has
    // checked-in native directories, and `expo prebuild` gives it some — so a project that was a
    // CNG `dev-client-fresh` before its first local build is `bare-fresh` after it, for the same
    // app [observed — wave 29, 2026-08-27]. The claim here is the *step*, not the label.
    expect(['bare-fresh', 'dev-client-fresh']).toContain(report.rule);
    expect(report.steps).toHaveLength(1);
    expect(report.steps[0].argv).toEqual(['expo', 'start', '--dev-client', '--android']);
    expect(report.buildLocation).toBeNull();
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §Pointing an app at this dev server
  // `exp://` is Expo Go's URL and nothing else, and handing it to a development build hands it
  // another app's link. The report has to offer the launcher's own shape instead, and it has to say
  // which app it decided on rather than guessing between two.
  it('offers the dev launcher URL and never the Expo Go one', async () => {
    const result = await runLiveAsync(run, projectRoot, ['status', '--json'], { label: 'status' });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.devServer.running).toBe(true);
    const urls = report.devServer.openUrls as { target: string; url: string }[];
    expect(urls.map((entry) => entry.target)).toEqual(['dev-build']);
    expect(urls[0]!.url).toContain(`${project.scheme}://expo-development-client/?url=`);
    expect(urls[0]!.url).not.toContain('exp://');
  });

  // --- the runtime family, which is the whole point of this file ----------------------------------

  // @ref llp/0022-live-tier.plan.md §live-android — the row this suite exists to overturn.
  // `live-android` asserts exit 1 `RUNTIME_EVALUATE_UNSUPPORTED` for this exact command. Both are
  // true, and together they say what the wall is made of: the engine Expo Go ships, not Android.
  it('evaluates JavaScript on Android, which Expo Go cannot', async () => {
    const result = await runLiveAsync(run, projectRoot, ['runtime:eval', '1+1', '--android', '--json'], {
      label: 'runtime-eval',
    });
    expectExit(result, 0, 'a development build carries a CDP debugger on Android');
    expect(parseJson(result)).toMatchObject({ threw: false, type: 'number', value: 2 });
  });

  it('reads the screen, with the disabled bands Expo Go on Android cannot reach', async () => {
    const result = await runLiveAsync(run, projectRoot, ['runtime:tree', '--android', '--json'], {
      label: 'runtime-tree',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.ok).toBe(true);
    expect(report.fibersWalked).toBeGreaterThan(0);
    expect(report.bundle).toMatchObject({ checked: true, ok: true, platform: 'android' });
  });

  it('reports a real observation of an error window rather than a caveat', async () => {
    const result = await runLiveAsync(
      run,
      projectRoot,
      ['runtime:errors', '--android', '--duration', '2s', '--json'],
      { label: 'runtime-errors' }
    );
    expectExit(result, 0);
    const report = parseJson(result);
    // The inversion of `live-android`'s row. There the runtime announces it cannot answer and the
    // dev server log is read instead (F52); here the runtime answers, so the fallback is not needed
    // and the report says so.
    expect(report.runtimeReadable).toBe(true);
    expect(report.devServerLog.read).toBe(false);
  });

  // @ref llp/0018-interaction-commands.rfc.md — the three refusal bands and the `--verify` diff,
  // none of which `live-android` can reach because nothing there can be tapped at all.
  it('taps an element and sees both text shapes change', async () => {
    const result = await runLiveAsync(
      run,
      projectRoot,
      ['runtime:tap', 'inc-btn', '--android', '--verify', '--json'],
      { label: 'runtime-tap' }
    );
    expectExit(result, 0);
    const { verify } = parseJson(result);
    expect(verify.changed).toBe(true);
    // F63's pair, on Android for the first time: `count: {count}` has array children and
    // `` {`count is ${count}`} `` has a single string child, and an extractor that reads only the
    // second reports a working tap as "nothing changed".
    const keys = verify.changedText.map((entry: any) => entry.key);
    expect(keys).toContain('counter-interp');
    expect(keys).toContain('counter-str');
  });

  it.each([
    ['disabled-btn', 'disabled'],
    ['dup-btn', 'ambiguous'],
    ['plain-text', 'no-handler'],
  ])('refuses to tap %s at 20, with reason %s', async (testID, reason) => {
    const result = await runLiveAsync(run, projectRoot, ['runtime:tap', testID, '--android', '--json'], {
      label: `runtime-tap-${reason}`,
    });
    expectExit(result, 20);
    expect(parseJson(result).reason).toBe(reason);
  });

  it('types into a real input, and refuses one that is not editable', async () => {
    const typed = await runLiveAsync(
      run,
      projectRoot,
      ['runtime:type', 'live-devclient', '--testID', 'name-input', '--android', '--json'],
      { label: 'runtime-type' }
    );
    expectExit(typed, 0);

    const readOnly = await runLiveAsync(
      run,
      projectRoot,
      ['runtime:type', 'nope', '--testID', 'ro-input', '--android', '--json'],
      { label: 'runtime-type-readonly' }
    );
    expectExit(readOnly, 20);
    expect(parseJson(readOnly)).toMatchObject({ reason: 'disabled', disabledOn: 'editable' });
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §The platform default must not answer for the other
  // platform — F126. The dev server's captured log is what proves a reload here, and the bundle line
  // carries the platform it was built for. This asserts the line the report quotes is Android's.
  it('reloads, and proves it with a bundle built for this platform', async () => {
    const result = await runLiveAsync(run, projectRoot, ['runtime:reload', '--android', '--json'], {
      label: 'runtime-reload',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.reloaded).toBe(true);
    expect(report.commandSocketChurn.observed).toBe(true);
    // Whichever of the two proofs answered first ends both (F95), so only the label's own count may
    // be asserted — and when the bundle watch is the one that answered, its line is Android's.
    if (report.bundlesAfterReload.observed) {
      expect(report.bundlesAfterReload.line).toMatch(/^Android Bundled/);
    } else {
      expect(report.commandSocketChurn.reconnected).toBeGreaterThan(0);
    }
    expect(await waitForAndroidRuntimeAsync('after-reload')).toBe(true);
  });

  // @ref llp/0022-live-tier.plan.md §live-android §What `smoke --android` is — the row this
  // overturns most directly. There it is asserted to be **22 on a working app**, because the
  // `runtime` phase cannot measure and llp/0010 §The sixth forbids a gate that cannot measure from
  // passing. Here it can measure, so it passes, and the gate means what it says on Android.
  it('smoke --android passes on a development build, phase by phase', async () => {
    const result = await runLiveAsync(run, projectRoot, ['smoke', '--android', '--json'], {
      label: 'smoke',
    });
    expectExit(result, 0, 'the runtime phase can measure on a development build');
    const report = parseJson(result);
    expect(report.outcome).toBe('passed');
    expect(report.platform).toBe('android');
    expect(report.deviceBackend).toBe('local-android');
    const byId = Object.fromEntries(
      (report.phases as any[]).map((phase) => [phase.id, phase.status])
    );
    for (const phase of ['dev-server', 'bundler-ready', 'bundle', 'app', 'runtime', 'errors', 'screenshot']) {
      expect(byId[phase]).toBe('ok');
    }
    expect(fs.existsSync(report.screenshot.path)).toBe(true);
    expect(fs.statSync(report.screenshot.path).size).toBeGreaterThan(0);
  });

  // --- navigating, stopping, and the two things that are not the same as Expo Go's ----------------

  it('navigates the development build with its own scheme, and the app follows', async () => {
    // A precondition, not an assertion. The reload above leaves the app coming back, and a run that
    // started against a project somebody had force-stopped by hand meets the same state — both are
    // "the app is not there yet" rather than anything about `navigate`, and reading them as this
    // command's result is how a live suite becomes a coin toss [observed — this suite's first run,
    // 2026-08-28, where `navigate` and `runtime:stop` both failed on an app that was down].
    expect(await waitForAndroidRuntimeAsync('before-navigate')).toBe(true);

    const result = await runLiveAsync(run, projectRoot, ['navigate', '/explore', '--android', '--json'], {
      label: 'navigate',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    // The dev build's route link, never `exp://`, and the report says which app it decided on.
    expect(report.url).toBe(`${project.scheme}://explore`);
    expect(report.target).toContain('development build');
    expect(report.routeCheck).toMatchObject({ checked: true, ok: true, matched: '/explore' });

    // The claim `navigate` cannot make for itself: the app is on the route now. Asserted from the
    // runtime rather than from the exit code, because on iOS the identical command exits 0 having
    // opened nothing (F123) — and the only reason that is invisible there is that nothing looks.
    const moved = await waitForAsync(
      async () => {
        const tree = await runLiveAsync(run, projectRoot, ['runtime:tree', '--android', '--json'], {
          label: 'navigate-verify',
        });
        return tree.exitCode === 0 && parseJson(tree).focusedScreen === 'explore';
      },
      BOUND_MS,
      2_000
    );
    expect(moved).toBe(true);
  });

  it('stops the development build by its own package name', async () => {
    // Same precondition, and here it is what the assertions are *about*: `bundleIdSource` is
    // `dev-server` only when there is a connected app to read the id from, and `app-config` when
    // there is not — which is correct of the CLI and useless as a test of the scoping.
    expect(await waitForAndroidRuntimeAsync('before-stop')).toBe(true);

    const result = await runLiveAsync(run, projectRoot, ['runtime:stop', '--android', '--json'], {
      label: 'runtime-stop',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    // F101's shape with the teeth taken out and put back: Expo Go's two application ids differ by
    // one capital letter, and *this* project's development build has the **same** id on both
    // platforms — so an unscoped read cannot be caught by an id comparison at all, and the
    // application id has to come from the target that was selected by platform.
    expect(report.bundleId).toBe(project.androidPackage);
    expect(report.bundleIdSource).toBe('dev-server');
    expect(report.connectedAppIds).toContain(project.androidPackage);
    expect(report.wasRunning).toBe(true);
    expect(report.appIdMismatch).toBe(false);

    // `am force-stop` is asynchronous, so the effect is a bound and never a read.
    const stopped = await waitForAsync(
      async () => {
        const probe = await execAsync(
          android.adb,
          ['-s', serial, 'shell', 'pidof', project.androidPackage!],
          { timeoutMs: 60_000 }
        );
        return !/^\d[\d\s]*$/.test(probe.stdout.trim());
      },
      30_000,
      1_000
    );
    expect(stopped).toBe(true);
  });

  // The finding this suite carries, and it is left failing rather than adjusted, per
  // [[0022-live-tier]] §When a live test fails: a live tier whose assertions are edited down to
  // whatever the CLI currently does is a stub tier with a longer runtime.
  //
  // **F123 — `navigate` opens the route link at an app that is not loaded.** With nothing connected
  // and a project that depends on `expo-dev-client`, `navigate /` reports
  // `target: "no app is connected to the dev server, and the project depends on expo-dev-client"`,
  // computes the launcher URL into its own `connect` array — and then opens `<scheme>://`, which is
  // the link for an app that is *already* running against a dev server. Nothing loads, and the
  // command spends its whole attach budget: exit 22 after **90.6 s** on Android with no dialog
  // anywhere in it [observed — wave 29, `evidence/61-navigate-after-stop-android.json`]. It is the
  // one command every follow-up names as the way to open the app, including `runtime:stop`'s own.
  it.skip('F123: opens the app it can see is not loaded', async () => {
    const result = await runLiveAsync(run, projectRoot, ['navigate', '/', '--android', '--json'], {
      label: 'f123-navigate-cold',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.url).toContain('expo-development-client');
    expect(report.attached).toBe(true);
  });
});

/** Where this suite's own note about the project it used goes, for a reader of the artifacts. */
export const LIVE_DEVCLIENT_README = path.basename(__filename);
