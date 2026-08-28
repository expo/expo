/* eslint-env jest */
// @ref llp/0022-live-tier.plan.md §live-local: the whole loop, on a real simulator
//
// The local half of the live tier: one project scaffolded by `@expo/agent-cli new` into a scratch directory
// outside every git checkout, and the whole v1 local loop run against it on a booted iOS simulator
// running Expo Go. Nothing here is stubbed. `expo` is the one the scaffold installed, the bundler is
// Metro, the app is Expo Go, and the debugger connection is a real CDP session onto Hermes.
//
// What this suite reaches that the stub tier cannot, in one sentence each:
//
//  - **The generated-types gate.** A brand-new project fails `typecheck` because `expo-env.d.ts` is
//    written by the first `expo start` and `tsconfig.json` already references it. Nothing about that
//    is visible to a stub `expo`, and the fix (F64) is a claim about a file another CLI writes — so
//    the only test of it is a real scaffold, a real start, and the same command twice.
//  - **The inspector.** @ref llp/0002 §Tier 0 doubles the dev server, not the app: the stub carries
//    no CDP, so every `runtime:*` success is unreachable there. Here they are the ordinary case.
//  - **The break-and-fix cycle.** A syntax error in a screen, six commands refusing at 20, the error
//    undone, and the same six green. The stub tier can pin the refusal; it cannot pin that Metro
//    agrees, that the served bundle is the one on disk, or that recovery needs no restart.
//
// One thing this suite deliberately does not do is break the bundle by adding a dead statement.
// `@expo/agent-cli new` scaffolds `experiments.reactCompiler: true`, and the React Compiler deletes
// unreachable statements out of a render body, so `(undefined as any).boom` is compiled away and
// every gate stays honestly green [observed — friction run 7 §5]. A syntax error is the break that
// is a break.

import fs from 'node:fs';
import path from 'node:path';

import { allOf, bootedSimulatorGate, builtBinGate, describeLive, type Simulator } from '../prereq';
import {
  LIVE_PORT_BASE,
  LiveRun,
  expectExit,
  findFreePortAsync,
  fixturesDir,
  httpStatusAsync,
  looksLikeUncaughtException,
  looksLikeUnreportedCrash,
  parseJson,
  runLiveAsync,
  waitForAsync,
} from '../utils';

const simulatorProbe = bootedSimulatorGate();
const gate = allOf(builtBinGate(), simulatorProbe.gate);
const simulator = simulatorProbe.simulator as Simulator;

/** The port this suite's dev server runs on. Above the Expo CLI's own 8081-8085 sweep. */
/**
 * The port this suite's dev server runs on, chosen in `beforeAll` rather than fixed.
 *
 * @see findFreePortAsync — a stale server from a crashed run on a hardcoded port took 22 of 31 tests
 * down with it once, all of them reporting something that was not about the CLI.
 */
let PORT = LIVE_PORT_BASE;

/** The route the lab screen lives at, reachable because the suite registers a tab trigger for it. */
const LAB_ROUTE = '/lab';

/**
 * How long a live check gets before it counts as a failure.
 *
 * @ref llp/0022-live-tier.plan.md §What a live assertion is allowed to be
 * One generous bound rather than a per-command budget: this suite asserts that things happen, never
 * that they happen quickly, and a bound tight enough to catch a regression in speed would also fail
 * on a laptop compiling something else.
 */
const BOUND_MS = 60_000;

describeLive('live-local', gate)('live-local: the whole loop on a real simulator', () => {
  const run = new LiveRun('live-local');
  let projectRoot = '';
  let labFile = '';
  const labSource = fs.readFileSync(path.join(fixturesDir, 'lab', 'lab.tsx'), 'utf8');

  beforeAll(async () => {
    run.prepare();
    PORT = await findFreePortAsync();

    // `@expo/agent-cli new` is the first command under test and the setup for every command after it, so it
    // is asserted here rather than in an `it` of its own: a scaffold that failed makes the rest of
    // this file meaningless, and jest reports a failing `beforeAll` as the suite's failure.
    const created = await runLiveAsync(
      run,
      run.tempDir,
      ['new', 'labapp', '--name', 'Lab App', '--json'],
      {
        label: 'new',
      }
    );
    run.spend.scaffolds += 1;
    expectExit(created, 0, '@expo/agent-cli new must create and install a project');
    const report = parseJson(created);
    expect(report.created).toBe(true);
    expect(report.installed).toBe(true);
    projectRoot = report.projectRoot;
    expect(fs.existsSync(path.join(projectRoot, 'package.json'))).toBe(true);

    // The lab screen, plus the tab trigger that makes its route reachable. The trigger is an
    // insertion into the scaffold's own tabs component rather than a committed replacement of it:
    // a replacement goes stale silently the next time the template changes, and an insertion that
    // cannot find its anchor fails loudly here, where it is a harness problem and not a finding.
    labFile = path.join(projectRoot, 'src', 'app', 'lab.tsx');
    fs.writeFileSync(labFile, labSource);
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

    // Cleanups are registered before anything that needs them, so a failure between here and the end
    // of the suite still ends the dev server and the app. `onCleanup` runs them newest-first, so the
    // one that deletes the directory the others run *in* is registered first, which is what makes it
    // run last — a live run whose cleanups fired in registration order reported
    // `spawn node ENOENT` for both of them [observed — 2026-08-27, the second run of this suite].
    run.onCleanup('scratch project', () => {
      if (!process.env.AGENT_CLI_LIVE_KEEP) {
        fs.rmSync(run.tempDir, { recursive: true, force: true });
      }
    });
    run.onCleanup('runtime:stop', async () => {
      await runLiveAsync(run, projectRoot, ['runtime:stop', '--json'], {
        label: 'cleanup-runtime-stop',
      });
    });
    run.onCleanup('dev:stop', async () => {
      await runLiveAsync(run, projectRoot, ['dev:stop', '--json'], {
        label: 'cleanup-dev-stop',
      });
      const freed = await waitForAsync(
        async () => (await httpStatusAsync(`http://127.0.0.1:${PORT}/status`)) === 0,
        30_000
      );
      if (!freed) {
        throw new Error(`something still answers on port ${PORT} after dev:stop`);
      }
    });
  });

  afterAll(async () => {
    await run.cleanUpAsync();
    console.log(run.costLine());
  });

  /**
   * Wait until the app is connected **and** showing the lab screen, re-opening it once if it is not.
   *
   * @ref llp/0022-live-tier.plan.md §What a live assertion is allowed to be
   * The precondition helper this suite needs most, and the reason it is one named function rather than
   * three copies of a poll. Two live facts sit behind it, both observed on 2026-08-27:
   *
   *  1. **Writing a file the app is running takes the runtime away for a moment.** Metro reloads, so
   *     `runtime:tap` answers `NO_APP_CONNECTED` at exit 1 and `smoke` answers exit 22
   *     `inconclusive` — both correct, and neither what a test about something else is asking.
   *  2. **Expo Go does not always come back from a reload.** In 2 of 4 runs the app was gone for the
   *     whole 120 s bound after `runtime:reload --route`. What `runtime:reload` itself claims —
   *     `appsReconnected > 0` at the moment it returned — is asserted by its own test and held every
   *     time. Whether a device still has the app open some seconds later is a fact about the device.
   *
   * So this is a **precondition**, not an assertion, and it recovers the way the CLI's own output says
   * to: `runtime:tree`'s refusal ends in `Try: npx @expo/agent-cli navigate /`, and that is exactly what the
   * second half does. It is logged when it fires, because a precondition that quietly repairs the world
   * is how a suite stops noticing that the world keeps breaking.
   */
  async function waitForLabScreenAsync(label: string): Promise<boolean> {
    const onLabScreen = async (attempt: string) => {
      const tree = await runLiveAsync(
        run,
        projectRoot,
        ['runtime:tree', '--testID', 'inc-btn', '--json'],
        { label: `tree-wait-${attempt}` }
      );
      if (tree.exitCode !== 0 && tree.exitCode !== 20) {
        // Exit 1 here is `NO_APP_CONNECTED`: there is no runtime to read yet.
        return false;
      }
      return parseJson(tree).focusedScreen === 'lab';
    };

    // Two seconds between polls, not the default half-second: each poll is a whole `@expo/agent-cli` process
    // whose output is written to the evidence directory, and a 120-second wait at 500 ms left 159
    // near-identical artifacts to read past [observed — 2026-08-27].
    if (await waitForAsync(() => onLabScreen(label), BOUND_MS, 2_000)) {
      return true;
    }
    console.log(
      `[live] the app was not on the lab screen within ${BOUND_MS}ms at "${label}"; re-opening it with ` +
        `navigate, which is what runtime:tree's own Try: line says to run`
    );
    await runLiveAsync(run, projectRoot, ['navigate', LAB_ROUTE, '--json'], {
      label: `navigate-recover-${label}`,
    });
    return waitForAsync(() => onLabScreen(`${label}-reopened`), BOUND_MS, 2_000);
  }

  // --- the read-only gates, before anything is running -------------------------------------------

  it('install --check answers from the real registry resolution', async () => {
    const result = await runLiveAsync(run, projectRoot, ['install', '--check', '--json'], {
      label: 'install-check',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    // F76's contract: the Expo CLI's own report belongs under `check.report`, not folded into the
    // `output` field the help documents as the failure case.
    expect(report.check.ok).toBe(true);
    expect(report.check.report).not.toBeNull();
    expect(report.check.report.upToDate).toBe(true);
  });

  it('doctor runs the real expo-doctor and normalizes every check', async () => {
    const result = await runLiveAsync(run, projectRoot, ['doctor', '--json'], { label: 'doctor' });
    // The protocol, not expo-doctor's own code (F68): 0 when the checks passed, 20 when one failed,
    // and 1 reserved for this command being unable to run.
    expect([0, 20]).toContain(result.exitCode);
    const report = parseJson(result);
    // A real expo-doctor run reports twenty-odd checks; the parse has to be `full` rather than the
    // best-effort fallback, which is the half no fixture of its own output can put at risk.
    expect(report.parse).toBe('full');
    expect(report.checks.length).toBeGreaterThan(15);
    expect(report.checks.every((check: any) => typeof check.name === 'string')).toBe(true);
    expect(report.passed + report.failed).toBe(report.checks.length);
    if (result.exitCode === 0) {
      expect(report.failed).toBe(0);
    }
  });

  it('status reads the real project and its real fingerprint', async () => {
    const result = await runLiveAsync(run, projectRoot, ['status', '--json'], { label: 'status' });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.project.isExpoApp).toBe(true);
    expect(report.project.sdkVersion).toMatch(/^\d+\./);
    expect(report.project.native).toBe('cng');
    expect(report.expoGo.compatible).toBe(true);
    // A real 40-hex fingerprint from the real @expo/fingerprint the project resolved, which is the
    // half a stub can never produce: llp/0002 §A flag is not shipped names the CLI-version trap this
    // is the live end of.
    expect(report.freshness.hash).toMatch(/^[0-9a-f]{40}$/);
  });

  it('status --assert on an unmeasurable project exits 22, not 0 and not 20', async () => {
    const result = await runLiveAsync(
      run,
      projectRoot,
      ['status', '--assert', 'js-only', '--json'],
      {
        label: 'status-assert',
      }
    );
    // 22 is the honest answer for a project with no recorded build: there is no class to gate on.
    // The value of running it live is that the reason is a real absence rather than a fixture's.
    expectExit(result, 22, 'a fresh project has no recorded build, so no class can be established');
    const report = parseJson(result);
    expect(
      report.freshness.platforms.some((p: any) => p.state === 'stale' || p.state === 'unknown')
    ).toBe(true);
  });

  // --- the generated-types gate: F64, which only a real scaffold has -----------------------------

  it('typecheck on a brand-new project fails, and says which file the Expo CLI has yet to write', async () => {
    const result = await runLiveAsync(run, projectRoot, ['typecheck', '--json'], {
      label: 'typecheck-fresh',
    });
    expectExit(result, 20, 'the scaffold references expo-env.d.ts before the Expo CLI writes it');
    const report = parseJson(result);
    expect(report.errorCount).toBeGreaterThan(0);
    // The fix for F64 is the `generatedTypes` block: the diagnostics are about a generated file, and
    // the follow-up has to be the command that generates it rather than "fix the diagnostics above".
    expect(report.generatedTypes).not.toBeNull();
    expect(report.generatedTypes.file).toBe('expo-env.d.ts');
    expect(report.generatedTypes.command).toContain('@expo/agent-cli dev');
    expect(report.followups.map((f: any) => f.id)).toContain('typecheck-generate-types');
  });

  // --- the dev server -----------------------------------------------------------------------------

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
    expect(report.projectRootMatched).toBe(true);
    expect(typeof report.pid).toBe('number');

    // F61's invariant, and the reason this assertion is here rather than in the stub tier: `ready`
    // is a claim about a process, and the way it went wrong was a process that answered once and
    // then died. So the check is made again, after the fact, against the machine.
    expect(await httpStatusAsync(`http://127.0.0.1:${PORT}/status`)).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 8_000));
    expect(await httpStatusAsync(`http://127.0.0.1:${PORT}/status`)).toBe(200);
  });

  it('typecheck passes once the dev server has written the generated types', async () => {
    expect(fs.existsSync(path.join(projectRoot, 'expo-env.d.ts'))).toBe(true);
    const result = await runLiveAsync(run, projectRoot, ['typecheck', '--json'], {
      label: 'typecheck-warm',
    });
    expectExit(result, 0, 'the file the previous failure named now exists');
    const report = parseJson(result);
    expect(report.errorCount).toBe(0);
    expect(report.generatedTypes).toBeNull();
  });

  it('dev:logs reads what the detached server actually printed', async () => {
    const result = await runLiveAsync(run, projectRoot, ['dev:logs', '--json'], {
      label: 'dev-logs',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.logFile).toContain(path.join('.expo', 'dev', 'logs'));
    expect(fs.existsSync(report.logFile)).toBe(true);
  });

  // --- getting the app onto the device -------------------------------------------------------------

  it('navigate opens the route on the simulator and the app attaches', async () => {
    const result = await runLiveAsync(run, projectRoot, ['navigate', LAB_ROUTE, '--json'], {
      label: 'navigate-lab',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.routeCheck.ok).toBe(true);
    expect(report.routeCheck.matched).toBe(LAB_ROUTE);
    expect(report.deviceBackend).toBe('local-ios');
    expect(report.deviceId).toBe(simulator.udid);
    expect(report.url).toBe(`exp://127.0.0.1:${PORT}/--${LAB_ROUTE}`);
    // `attached` is the only claim in this report that needs a runtime on the other end, and it is
    // the one the stub tier cannot make: it means a CDP target appeared for the app.
    expect(report.attached).toBe(true);
  });

  it('navigate refuses a route the project does not have, and lists the ones it has', async () => {
    const result = await runLiveAsync(run, projectRoot, ['navigate', '/no-such-route', '--json'], {
      label: 'navigate-bogus',
    });
    expectExit(result, 1, 'a route that does not exist is a bad argument, not a failed outcome');
    const report = parseJson(result);
    expect(report.error.code).toBe('ROUTE_NOT_FOUND');
    // The route list in the message comes from the real Expo Router sitemap of the real project, so
    // it names the file this suite wrote a moment ago.
    expect(report.error.message).toContain(LAB_ROUTE);
  });

  it('runtime:reload puts the app on the lab route and is verified by the app reconnecting', async () => {
    const result = await runLiveAsync(
      run,
      projectRoot,
      ['runtime:reload', '--route', LAB_ROUTE, '--json'],
      {
        label: 'reload-lab',
      }
    );
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.reloaded).toBe(true);
    expect(report.bundle.ok).toBe(true);
    // @ref llp/0005 §Peer churn proves the app acted. The stub tier has the two halves of this and
    // not the thing itself, because it has no client that can disconnect and come back.
    expect(report.verifiedBy).toBe('message-socket-peers');
    // F95: the label's **own** count, which is what this used to assert against `appsReconnected` —
    // a different signal's count, and zero on 3 of one run's tests and 1 of the next's. The two
    // watches race on one budget by design (`src/runtime/reload/reloadAsync.ts`), so whether the
    // debugger target arrives before the bundle line is a property of the moment; whether the app
    // reconnected to the command socket is what this rung established.
    expect(report.commandSocketChurn.reconnected).toBeGreaterThan(0);
    expect(report.commandSocketChurn.observed).toBe(true);
    // And a zero on the other count is never a bare number: it says which fact it is.
    if (report.appsReconnected === 0) {
      expect(report.appsReconnectedReason).toBeTruthy();
    } else {
      expect(report.appsReconnectedReason).toBeNull();
    }

    expect(await waitForLabScreenAsync('after-reload')).toBe(true);
  });

  // --- reading and driving the running app ---------------------------------------------------------

  it('runtime:tree reports the elements of the lab screen with their handler facts', async () => {
    const result = await runLiveAsync(run, projectRoot, ['runtime:tree', '--json'], {
      label: 'tree-default',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.focusedScreen).toBe('lab');
    const byId = (testID: string) => report.nodes.filter((n: any) => n.testID === testID);
    // F69's contract: the default listing carries the facts `--testID` carries, so an agent does not
    // have to make one call per id to learn that a button is disabled or that two elements share one.
    expect(byId('inc-btn').length).toBeGreaterThan(0);
    expect(byId('disabled-btn').some((n: any) => n.disabled === true)).toBe(true);
    expect(byId('dup-btn').length).toBeGreaterThan(0);
    // F70: a placeholder is not content. An empty input reports its placeholder under `placeholder`.
    const nameInput = byId('name-input').find((n: any) => n.component === 'TextInput');
    expect(nameInput).toBeDefined();
    expect(nameInput.placeholder).toBe('type a name');
  });

  it('runtime:tap refuses a disabled element with 20 and names what disabled it', async () => {
    const result = await runLiveAsync(run, projectRoot, ['runtime:tap', 'disabled-btn', '--json'], {
      label: 'tap-disabled',
    });
    expectExit(result, 20);
    const report = parseJson(result);
    expect(report.reason).toBe('disabled');
    expect(report.disabled).toBe(true);
    expect(report.disabledOn).toBe('disabled');
    expect(report.called).toBe(false);
  });

  it('runtime:tap refuses two real elements under one testID with 20', async () => {
    const result = await runLiveAsync(run, projectRoot, ['runtime:tap', 'dup-btn', '--json'], {
      label: 'tap-ambiguous',
    });
    expectExit(result, 20);
    const report = parseJson(result);
    expect(report.reason).toBe('ambiguous');
    expect(report.matched).toBe(2);
    expect(report.candidates.map((c: any) => c.index)).toEqual([0, 1]);
    expect(report.called).toBe(false);
  });

  it('runtime:tap refuses an element with no handler above it with 20', async () => {
    const result = await runLiveAsync(run, projectRoot, ['runtime:tap', 'plain-text', '--json'], {
      label: 'tap-no-handler',
    });
    expectExit(result, 20);
    const report = parseJson(result);
    expect(report.reason).toBe('no-handler');
    expect(report.called).toBe(false);
  });

  it('runtime:tap --verify sees an interpolated Text change, not only a single-string one', async () => {
    const result = await runLiveAsync(
      run,
      projectRoot,
      ['runtime:tap', 'inc-btn', '--verify', '--json'],
      {
        label: 'tap-verify',
      }
    );
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.called).toBe(true);
    expect(report.verify.changed).toBe(true);
    const changed = report.verify.changedText.map((c: any) => c.key);
    // F63, which is the whole reason both Texts are in the fixture: `count is {n}` was seen and
    // `count: {n}` was not, so a working tap was reported as "nothing changed". Both, or neither.
    expect(changed).toContain('counter-str');
    expect(changed).toContain('counter-interp');
  });

  it('runtime:type types into a real input and refuses a read-only one with 20', async () => {
    const typed = await runLiveAsync(
      run,
      projectRoot,
      ['runtime:type', 'live-tier', '--testID', 'name-input', '--json'],
      { label: 'type-ok' }
    );
    expectExit(typed, 0);
    const typedReport = parseJson(typed);
    expect(typedReport.called).toBe(true);
    expect(typedReport.text).toBe('live-tier');

    const refused = await runLiveAsync(
      run,
      projectRoot,
      ['runtime:type', 'nope', '--testID', 'ro-input', '--json'],
      { label: 'type-readonly' }
    );
    expectExit(refused, 20);
    const refusedReport = parseJson(refused);
    expect(refusedReport.reason).toBe('disabled');
    expect(refusedReport.disabledOn).toBe('editable');
    expect(refusedReport.called).toBe(false);
  });

  it('runtime:errors reads the runtime over its own debugger connection', async () => {
    const result = await runLiveAsync(run, projectRoot, ['runtime:errors', '--json'], {
      label: 'errors',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    // The claim the stub tier cannot make at all: a runtime answered `Runtime.evaluate`, so the
    // empty error list is an answer rather than the absence of one.
    expect(report.runtimeReadable).toBe(true);
    expect(report.count).toBe(0);
  });

  it('runtime:eval evaluates in the running app', async () => {
    const result = await runLiveAsync(run, projectRoot, ['runtime:eval', '1 + 1', '--json'], {
      label: 'eval',
    });
    // @ref llp/0019 §What is still not tested — "a successful runtime:eval is unreachable at tier 0"
    // is the row this test fills, and the only way to fill it is a real Hermes on the other end.
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.threw).toBe(false);
    expect(report.type).toBe('number');
    expect(report.value).toBe(2);
  });

  it('smoke passes on a working app, with the phases it claims', async () => {
    const result = await runLiveAsync(run, projectRoot, ['smoke', '--json'], {
      label: 'smoke-green',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.ok).toBe(true);
    expect(report.outcome).toBe('passed');
    const status = Object.fromEntries(report.phases.map((p: any) => [p.id, p.status]));
    expect(status['dev-server']).toBe('ok');
    expect(status.bundle).toBe('ok');
    expect(status.app).toBe('ok');
    expect(status.runtime).toBe('ok');
    expect(status.errors).toBe('ok');
    expect(status.screenshot).toBe('ok');
    // A screenshot is a file on this machine or it is not a screenshot.
    expect(fs.existsSync(report.screenshot.path)).toBe(true);
    expect(fs.statSync(report.screenshot.path).size).toBeGreaterThan(1000);
  });

  // --- break, and fix ------------------------------------------------------------------------------

  describe('the break-and-fix cycle', () => {
    const broken = `${'\n'}this is not valid typescript at all ((((${'\n'}`;

    beforeAll(() => {
      fs.appendFileSync(labFile, broken);
    });

    afterAll(async () => {
      fs.writeFileSync(labFile, labSource);
      // Put the app back on working code before the next describe block reads it.
      await runLiveAsync(run, projectRoot, ['runtime:reload', '--route', LAB_ROUTE, '--json'], {
        label: 'reload-after-fix',
      });
    });

    it.each([
      ['smoke', ['smoke', '--json']],
      ['runtime:tree', ['runtime:tree', '--testID', 'inc-btn', '--json']],
      ['runtime:tap', ['runtime:tap', 'inc-btn', '--json']],
      ['runtime:type', ['runtime:type', 'x', '--testID', 'name-input', '--json']],
      ['runtime:reload', ['runtime:reload', '--json']],
      ['typecheck', ['typecheck', '--json']],
    ])('%s refuses at 20 while the entry bundle does not compile', async (name, argv) => {
      const result = await runLiveAsync(run, projectRoot, argv as string[], {
        label: `broken-${name.replace(':', '-')}`,
      });
      // F62: the three interaction commands shipped without the bundle check `runtime:reload` had,
      // so all three reported a verified pass against a bundle that no longer existed. Every gate in
      // the surface answers 20 for "the code does not compile", and this is the whole list of them.
      expectExit(result, 20, `${name} must not report a pass against code that does not compile`);
      const report = parseJson(result);
      if (name !== 'typecheck') {
        expect(report.bundle.ok).toBe(false);
        expect(JSON.stringify(report.bundle.error)).toContain('lab.tsx');
      } else {
        expect(report.errorCount).toBeGreaterThan(0);
      }
    });

    it('dev:logs carries the bundler error the gates refused on', async () => {
      const result = await runLiveAsync(run, projectRoot, ['dev:logs', '--json'], {
        label: 'broken-dev-logs',
      });
      expectExit(result, 0);
      const report = parseJson(result);
      expect(report.lines.join('\n')).toContain('lab.tsx');
    });
  });

  it('the same gates are green again after the break is undone, with no restart', async () => {
    // The recovery half of the cycle, and the reason it is its own test: a gate that refuses forever
    // is as wrong as one that never refuses, and the stub tier cannot tell the difference because
    // its bundle response is whatever the fixture was written to return.
    //
    // The wait comes first, and it has to. Restoring the file made Metro reload the app, and
    // `runtime:reload` in the block above reloaded it again — so for a second or two there is no
    // runtime here at all, and `smoke` answers exit 22 `inconclusive` with `runtime: "No target
    // found."` [observed — 2026-08-27]. That 22 is *correct*: nothing was shown to be wrong and
    // nothing was proved right. It is also not what this test is asking about, so the suite waits for
    // the app to be back before asking. Bounded, not slept — see `waitForLabScreenAsync`.
    expect(await waitForLabScreenAsync('recovered')).toBe(true);

    const smoke = await runLiveAsync(run, projectRoot, ['smoke', '--json'], {
      label: 'smoke-recovered',
    });
    expectExit(smoke, 0);
    expect(parseJson(smoke).ok).toBe(true);

    const typecheck = await runLiveAsync(run, projectRoot, ['typecheck', '--json'], {
      label: 'typecheck-recovered',
    });
    expectExit(typecheck, 0);

    const tap = await runLiveAsync(
      run,
      projectRoot,
      ['runtime:tap', 'inc-btn', '--verify', '--json'],
      {
        label: 'tap-recovered',
      }
    );
    expectExit(tap, 0);
    expect(parseJson(tap).verify.changed).toBe(true);
  });

  // --- stopping ------------------------------------------------------------------------------------

  it('runtime:stop ends the app on the device it names', async () => {
    const result = await runLiveAsync(run, projectRoot, ['runtime:stop', '--json'], {
      label: 'runtime-stop',
    });
    expectExit(result, 0);
    const report = parseJson(result);
    expect(report.stopped).toBe(true);
    expect(report.deviceId).toBe(simulator.udid);
    expect(report.bundleId).toBe('host.exp.Exponent');
    // The invariant, rather than `wasRunning: true`. Whether an app is connected at the instant this
    // runs is a property of the moment — the previous test's tap could have raced a Metro reload — and
    // the contract that must hold in either case is that `wasRunning` reports what the dev server's
    // target list actually said. F61's lesson applied to a different field: a claim about a process is
    // only worth having if it is the claim the evidence supports.
    expect(report.wasRunning).toBe(report.connectedAppIds.length > 0);
    if (report.wasRunning) {
      expect(report.connectedAppIds).toContain('host.exp.Exponent');
      expect(report.bundleIdSource).toBe('dev-server');
    }
  });

  it('dev:stop ends the dev server it started, and the port is free after', async () => {
    // The **effect**, which is what this command is for and which holds on every run observed —
    // including the ones where the report itself crashed (F94, below): the process is killed before the
    // probe that dies, so `dev:stop` does its job and then fails to say so.
    const result = await runLiveAsync(run, projectRoot, ['dev:stop', '--json'], {
      label: 'dev-stop',
    });
    const freed = await waitForAsync(
      async () => (await httpStatusAsync(`http://127.0.0.1:${PORT}/status`)) === 0,
      30_000
    );
    expect(freed).toBe(true);

    // Whatever the exit code was, one of two things has to be true of the output, and neither is
    // "nothing": a report, or the crash F94 describes. A third outcome would be a new finding.
    if (!looksLikeUncaughtException(result)) {
      expectExit(result, 0);
      const report = parseJson(result);
      expect(report.stopped).toBe(true);
      expect(report.port).toBe(PORT);
      expect(report.processStillRunning).toBe(false);
      expect(report.portStillAnswering).toBe(false);
    } else {
      console.log(
        `[live] F94 hit on dev:stop: the server stopped and the report crashed (exit ${result.exitCode}). ` +
          `Evidence: ${result.artifact}`
      );
    }
  });

  // F94 — MAJOR, found by this suite on 2026-08-27, **fixed in wave 22**.
  //
  // What it was: **an uncaught exception exited 7**, the code `llp/0010` §Exit codes reserves for
  // needs-human, printing a raw Node stack with no `Try:` line and no `--json` error envelope.
  //
  // Mechanism, and it was one line: `src/utils/errors.ts` registered
  // `process.on('uncaughtException', handleTooManyOpenFileErrors)`, and that handler recognised macOS
  // `EMFILE` and **rethrew everything else**. Node's exit code for an exception thrown from inside an
  // `uncaughtException` handler is 7 — "Internal Exception Handler Run-Time Failure" — which collided
  // exactly with this CLI's needs-human code. Provable on its own, no @expo/agent-cli involved:
  //
  //     node -e "process.on('uncaughtException',(e)=>{throw e}); setImmediate(()=>{throw new Error('x')})"
  //     → exit 7
  //
  // So an agent that branched on 7 read every crash as "a person must intervene", and got none of the
  // three things that code promises: no `needsHuman` block, no event, no envelope. The inverse of F61 —
  // there a failure was reported as success; here a crash was reported as the one outcome an agent is
  // told it cannot recover from.
  //
  // How this suite met it, and why the trigger is left in place: `dev:stop` dies with
  // `Error: setTypeOfService EINVAL` out of undici's `writeH1`, during the `fetch` that probes the dev
  // server, on Node 26.5.0 / macOS. `fetch` surfaces it as an uncaught exception rather than a rejected
  // promise, so no `await` in the command could have caught it. Intermittent but common: roughly half of
  // the runs [2026-08-27]. **The undici bug is environmental and not this CLI's** — which is exactly
  // what makes it a usable live trigger for the handler above it.
  //
  // What is asserted now: whatever this machine's undici does, the crash is never exit 7 with a raw
  // stack. Either the command reports normally, or it reports the crash — exit 1, the stack, and the
  // `--json` envelope an agent can read.
  it('F94: dev:stop reports what it did, and a crash is exit 1 with a report', async () => {
    const result = await runLiveAsync(run, projectRoot, ['dev:stop', '--json'], {
      label: 'f94-dev-stop',
    });
    // The regression tripwire: 7 is a promise about a person, and a crash keeps none of it.
    expect(looksLikeUnreportedCrash(result)).toBe(false);
    expect(result.exitCode).not.toBe(7);

    if (looksLikeUncaughtException(result)) {
      // The crash fired. A tool error is exit 1, the stack is on stderr, and stdout still carries the
      // one object a `--json` run promises.
      expectExit(result, 1, 'a crash is a tool error, not a needs-human handoff');
      expect(result.all).toContain('This command crashed:');
      const report = parseJson(result);
      expect(report.error.code).toBe('UNCAUGHT_EXCEPTION');
      expect(report.error.needsHuman).toBeNull();
      expect(report.error.data.stack).toContain('at ');
      console.log(
        `[live] F94's trigger fired on dev:stop and was reported as a tool error (exit ` +
          `${result.exitCode}). Evidence: ${result.artifact}`
      );
    } else {
      // No crash this run: the dev server was already stopped by the test above, so the report says
      // there was nothing to stop. Either way it is a report rather than a stack.
      expectExit(result, 0);
      expect(parseJson(result).portStillAnswering).toBe(false);
    }
  });
});
