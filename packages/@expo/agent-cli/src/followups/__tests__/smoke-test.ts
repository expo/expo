// @ref llp/0009-smart-followups.rfc.md §Examples per command — the smoke gate.
//
// The rule these are tested against, more than any individual wording: never suggest re-running
// `smoke` for a state a re-run cannot change. A broken bundle, another project's dev server and a
// runtime with no debugger all stay exactly as they are however many times the gate runs, and the
// shipped follow-ups of the commands this replaces made that mistake often enough (F41, F48-8).

import { buildSmokeFollowUps, type SmokeFollowUpInput } from '../smoke';
import { MAX_FOLLOWUPS } from '../types';

function input(overrides: Partial<SmokeFollowUpInput> = {}): SmokeFollowUpInput {
  return {
    outcome: 'passed',
    devServerFound: true,
    bootstrap: true,
    foreignDevServer: false,
    bundleBroken: false,
    bundleFile: null,
    appsConnected: 1,
    runtimeSupported: true,
    failing: 0,
    screenshotTaken: true,
    screenshotPath: '/project/.expo/agent-cli/smoke.png',
    route: null,
    // Named, always: a re-run that drops the platform is a different run (F58).
    platform: 'ios',
    cloud: false,
    // The default is the common case after the `reload` phase: the app was put on the code on disk
    // before it was read, so the window these follow-ups are about is already trustworthy.
    reloadDisposition: 'reloaded',
    appMismatch: null,
    buildAttempted: false,
    ...overrides,
  };
}

/** Every command a set of follow-ups names, for the "no useless re-run" rule. */
function commands(overrides: Partial<SmokeFollowUpInput> = {}): string[] {
  return buildSmokeFollowUps(input(overrides)).map((followup) => followup.command);
}

describe(buildSmokeFollowUps, () => {
  it(`never prints more than the budget`, () => {
    for (const overrides of [
      {},
      { devServerFound: false },
      { bundleBroken: true },
      { appsConnected: 0 },
      { runtimeSupported: false },
      { failing: 2, outcome: 'failed' as const },
    ]) {
      expect(buildSmokeFollowUps(input(overrides)).length).toBeLessThanOrEqual(MAX_FOLLOWUPS);
    }
  });

  it(`gives every follow-up an id, a command and a reason`, () => {
    for (const followup of buildSmokeFollowUps(input({ failing: 1, outcome: 'failed' }))) {
      expect(followup.id).toEqual(expect.any(String));
      expect(followup.command).toMatch(/\S/);
      expect(followup.why).toMatch(/\S/);
    }
  });

  it(`names the detached start when no dev server answered`, () => {
    expect(commands({ devServerFound: false })).toContain(
      'npx @expo/agent-cli dev --detach --yes --wait-ready'
    );
  });

  // The attach-only run is the one with something to offer: dropping `--no-start` is the whole
  // difference between it and a run that would have started the dev server itself. A run that
  // already tried gets no such line — re-running it does the same thing again.
  it(`offers the bootstrapping run to one that was attach-only, and to no other`, () => {
    expect(commands({ devServerFound: false, bootstrap: false })).toContain(
      'npx @expo/agent-cli smoke --ios'
    );
    expect(commands({ devServerFound: false, bootstrap: true })).not.toContain(
      'npx @expo/agent-cli smoke --ios'
    );
  });

  // Every other suggestion would be about a stranger's app, so it is alone. And it is never a
  // re-run: the same scan finds the same foreign dev server.
  it(`answers another project's dev server with the report that names this one's`, () => {
    expect(commands({ foreignDevServer: true })).toEqual(['npx @expo/agent-cli status --json']);
  });

  // A bundle that does not compile is the whole answer, and the compiler sees more of it than the
  // bundler does — the bundler stops at the first file that will not transform.
  it(`answers a broken bundle with the compiler, and names the file`, () => {
    const followups = buildSmokeFollowUps(
      input({ bundleBroken: true, outcome: 'failed', bundleFile: 'src/app/notes.tsx' })
    );

    expect(followups[0]!.command).toBe('npx @expo/agent-cli typecheck');
    expect(followups[0]!.why).toContain('src/app/notes.tsx');
  });

  it(`answers no connected app with the command that opens one`, () => {
    // With the platform on it: `navigate` with no flag prefers a booted iOS simulator on a Mac,
    // which after `smoke --android` is the wrong device (F58).
    expect(commands({ appsConnected: 0, outcome: 'inconclusive' })[0]).toBe(
      'npx @expo/agent-cli navigate / --ios'
    );
    expect(commands({ appsConnected: 0, outcome: 'inconclusive', platform: 'android' })[0]).toBe(
      'npx @expo/agent-cli navigate / --android'
    );
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §Android. This never changes for this app on
  // this platform, so a caller told to look again would loop forever.
  it(`never suggests re-running for a runtime that has no debugger`, () => {
    const suggested = commands({
      runtimeSupported: false,
      outcome: 'inconclusive',
      platform: 'android',
    });

    expect(suggested).not.toContain('npx @expo/agent-cli smoke');
    // The other platform, which was measured to answer — not the same one again.
    expect(suggested.some((command) => command.includes('smoke --ios'))).toBe(true);
  });

  // @ref ../smoke — friction run 6, F55. This used to suggest `npx @expo/agent-cli dev --plan --android`
  // under "this prints what a development build would take". For a project Expo Go can still
  // serve, that command prints the **Expo Go** path: the plan engine only reaches the
  // development-build steps when a native module makes Expo Go incompatible (`src/plan/decide.ts`).
  it(`does not claim that dev --plan prints a development build`, () => {
    const followups = buildSmokeFollowUps(
      input({ runtimeSupported: false, outcome: 'inconclusive', platform: 'android' })
    );

    expect(followups.map((followup) => followup.command)).not.toContain(
      'npx @expo/agent-cli dev --plan --android'
    );
    expect(followups.map((followup) => followup.why).join(' ')).not.toContain(
      'what a development build would take'
    );
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §What proves a reload — an error window is a property of the
  // app's session and the session outlives a fix, so a reload leads.
  //
  // **For a run that has not already performed one.** The gate grew a `reload` phase of its own
  // (§The app under test is the code on disk), so the state this advice is for is now the state of
  // a run that declined it or could not prove it. The cases either side of that are next to this
  // file's `after the reload phase` block.
  it(`leads a non-empty window with the reload`, () => {
    expect(commands({ failing: 1, outcome: 'failed', reloadDisposition: 'declined' })[0]).toBe(
      'npx @expo/agent-cli runtime:reload --ios'
    );
  });

  // @ref llp/0010-agent-conventions.rfc.md §The fourth: `typecheck`. Nothing threw and the bundle
  // transformed, which is not the same as the code being right — a `Spacing.md` that evaluates to
  // undefined renders a screen with `padding: undefined` and every runtime gate green.
  it(`answers a pass with the gate this one is structurally blind to`, () => {
    expect(commands()[0]).toBe('npx @expo/agent-cli typecheck');
  });

  it(`points at the picture it took, when it took one`, () => {
    expect(commands()).toContain('open /project/.expo/agent-cli/smoke.png');
    expect(commands({ screenshotTaken: false, screenshotPath: null }).join(' ')).not.toContain(
      'open '
    );
  });

  it(`keeps the route on a re-run it suggests`, () => {
    expect(commands({ devServerFound: false, bootstrap: false, route: '/notes' })).toContain(
      'npx @expo/agent-cli smoke --ios --route /notes'
    );
    expect(commands({ bundleBroken: true, outcome: 'failed', route: '/notes' })).toContain(
      'npx @expo/agent-cli smoke --ios --route /notes'
    );
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §Cloud simulator
// The same rule the `platform` comment above states, for the other fact that decides which device a
// run is about. A `smoke --cloud` that could not find a session was answered with
// `npx @expo/agent-cli navigate / --ios` and `npx @expo/agent-cli smoke --ios` — a ladder off the backend the
// caller chose, onto a booted device the host that reached for the cloud may not have at all.
describe('a run that asked for the cloud', () => {
  it(`keeps --cloud on every command that takes it`, () => {
    for (const overrides of [
      { devServerFound: false },
      { appsConnected: 0 },
      { failing: 2, outcome: 'failed' as const },
      { outcome: 'inconclusive' as const, screenshotTaken: false, screenshotPath: null },
    ]) {
      for (const command of commands({ ...overrides, cloud: true })) {
        if (/@expo\/agent-cli (smoke|navigate|runtime:reload)\b/.test(command)) {
          expect(command).toContain('--cloud');
        }
      }
    }
  });

  it(`opens the app on the session rather than on a booted device`, () => {
    const followups = buildSmokeFollowUps(input({ appsConnected: 0, cloud: true }));
    const navigate = followups.find((followup) => followup.id === 'navigate')!;

    expect(navigate.command).toBe('npx @expo/agent-cli navigate / --ios --cloud');
    expect(navigate.why).not.toContain('booted device');
  });

  // The one rung a cloud run cannot have: a session is one device, so "try the other platform" is
  // a different session this CLI was never told about, and suggesting it with --cloud would name a
  // session that does not exist while suggesting it without would leave the backend silently.
  it(`never offers the other platform, which is another session`, () => {
    expect(commands({ runtimeSupported: false, cloud: true })).not.toContain(
      'npx @expo/agent-cli smoke --android'
    );
    // The local run still has it: there the other platform is another simulator on this machine.
    expect(commands({ runtimeSupported: false })).toContain('npx @expo/agent-cli smoke --android');
  });

  it(`changes nothing for a run that did not ask for the cloud`, () => {
    for (const overrides of [
      { devServerFound: false },
      { appsConnected: 0 },
      { failing: 2, outcome: 'failed' as const },
    ]) {
      for (const command of commands(overrides)) {
        expect(command).not.toContain('--cloud');
      }
    }
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §The app under test is the code on disk
//
// The `reload` phase makes one of these follow-ups stale. `runtime:reload` led the list of a
// non-empty error window because the window belonged to a session that outlived the fix — and the
// gate now performs that reload itself, so telling the caller to do it first is advice about a
// state this run has already left. It is still the right first step for the one run that declined.
describe(`${buildSmokeFollowUps.name} after the reload phase`, () => {
  const failed = { failing: 1, outcome: 'failed' as const };

  it(`does not suggest a reload the run already performed`, () => {
    expect(commands({ ...failed, reloadDisposition: 'reloaded' })).not.toContain(
      'npx @expo/agent-cli runtime:reload --ios'
    );
  });

  // An app this run opened fetched the served bundle on its way up, so the window is of the code on
  // disk for that run too.
  it(`does not suggest a reload for an app this run opened`, () => {
    expect(commands({ ...failed, reloadDisposition: 'not-needed' })).not.toContain(
      'npx @expo/agent-cli runtime:reload --ios'
    );
  });

  // `--no-reload`. The window really is of a session that may predate the fix, which is the state
  // the advice was written for, so it leads the list exactly as before.
  it(`still leads with a reload for a run that declined one`, () => {
    expect(commands({ ...failed, reloadDisposition: 'declined' })[0]).toBe(
      'npx @expo/agent-cli runtime:reload --ios'
    );
  });

  // An unproved reload leaves the same doubt as a declined one: nothing established which session
  // was read, so the reload is still the first thing to do about it.
  it(`still leads with a reload for a run whose reload was not proved`, () => {
    expect(commands({ ...failed, reloadDisposition: 'unproved' })[0]).toBe(
      'npx @expo/agent-cli runtime:reload --ios'
    );
  });

  // And what a run that already reloaded gets instead: the stacks, which is the thing the summary
  // does not have.
  it(`leads with the whole stacks when the window is already trustworthy`, () => {
    expect(commands({ ...failed, reloadDisposition: 'reloaded' })[0]).toBe(
      'npx @expo/agent-cli runtime:errors --ios --duration 5s --json'
    );
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §Expo Go is only a target for a project that fits in it
//
// The one inconclusive state a re-run can never change, which is the rule this file exists for
// (llp/0009, F41/F48-8). Expo Go answered for a project whose native code it does not contain: no
// amount of looking again makes that runtime the right one, and the only thing that helps is making
// the build that can run the project.
describe(`${buildSmokeFollowUps.name} for an app that cannot run the project`, () => {
  const mismatched = {
    outcome: 'inconclusive' as const,
    appMismatch: 'the app that answered is Expo Go, and this project cannot run in Expo Go',
  };

  it(`leads with the build that can run the project`, () => {
    expect(commands(mismatched)[0]).toBe('npx @expo/agent-cli dev --ios --yes');
  });

  // The rule itself: never offer a re-run of this gate for a state a re-run cannot change.
  it(`never offers to run the gate again`, () => {
    expect(commands(mismatched).join(' ')).not.toContain('agent-cli smoke');
  });

  // And it keeps the platform, like every other follow-up here (F58).
  it(`names the platform the run was about`, () => {
    expect(commands({ ...mismatched, platform: 'android' })[0]).toBe(
      'npx @expo/agent-cli dev --android --yes'
    );
  });
});

// @ref llp/0005-runtime-loop-tools.rfc.md §It builds what the app needs, and says so first
//
// The gate builds now, so "start one on its own and watch it fail" is no longer cheap advice: it is
// another native build, minutes of it, to see something the first one already wrote down. The log
// leads instead — llp/0009's rule is about re-runs that cannot change the state, and this is its
// neighbour: a re-run that can, at a price the reader does not have to pay to find out why.
describe(`${buildSmokeFollowUps.name} after a build that failed`, () => {
  const failedBuild = { devServerFound: false, buildAttempted: true, outcome: 'failed' as const };

  it(`leads with the log the build already wrote`, () => {
    expect(commands(failedBuild)[0]).toBe('npx @expo/agent-cli dev:logs');
  });

  // And it still offers the foreground run, second: watching it fail is the right next step when
  // the log does not say enough.
  it(`still offers to watch the build in the foreground`, () => {
    expect(commands(failedBuild)).toContain('npx @expo/agent-cli dev --detach --yes --wait-ready');
  });

  // A start that failed without building keeps what it had: there is no long build to avoid, so
  // starting one in the foreground is the cheapest way to see the failure.
  it(`leads with the foreground start when nothing was built`, () => {
    expect(commands({ ...failedBuild, buildAttempted: false })[0]).toBe(
      'npx @expo/agent-cli dev --detach --yes --wait-ready'
    );
  });
});
