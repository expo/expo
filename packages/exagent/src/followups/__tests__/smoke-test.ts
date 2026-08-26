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
    start: false,
    foreignDevServer: false,
    bundleBroken: false,
    bundleFile: null,
    appsConnected: 1,
    runtimeSupported: true,
    failing: 0,
    screenshotTaken: true,
    screenshotPath: '/project/.expo/exagent/smoke.png',
    route: null,
    // Named, always: a re-run that drops the platform is a different run (F58).
    platform: 'ios',
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
      'npx exagent dev --detach --yes --wait-ready'
    );
  });

  it(`offers --start to a run that was attach-only`, () => {
    expect(commands({ devServerFound: false, start: false })).toContain(
      'npx exagent smoke --start --ios'
    );
  });

  // Every other suggestion would be about a stranger's app, so it is alone. And it is never a
  // re-run: the same scan finds the same foreign dev server.
  it(`answers another project's dev server with the report that names this one's`, () => {
    expect(commands({ foreignDevServer: true })).toEqual(['npx exagent status --json']);
  });

  // A bundle that does not compile is the whole answer, and the compiler sees more of it than the
  // bundler does — the bundler stops at the first file that will not transform.
  it(`answers a broken bundle with the compiler, and names the file`, () => {
    const followups = buildSmokeFollowUps(
      input({ bundleBroken: true, outcome: 'failed', bundleFile: 'src/app/notes.tsx' })
    );

    expect(followups[0]!.command).toBe('npx exagent typecheck');
    expect(followups[0]!.why).toContain('src/app/notes.tsx');
  });

  it(`answers no connected app with the command that opens one`, () => {
    // With the platform on it: `navigate` with no flag prefers a booted iOS simulator on a Mac,
    // which after `smoke --android` is the wrong device (F58).
    expect(commands({ appsConnected: 0, outcome: 'inconclusive' })[0]).toBe(
      'npx exagent navigate / --ios'
    );
    expect(commands({ appsConnected: 0, outcome: 'inconclusive', platform: 'android' })[0]).toBe(
      'npx exagent navigate / --android'
    );
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §Android pass. This never changes for this app on
  // this platform, so a caller told to look again would loop forever.
  it(`never suggests re-running for a runtime that has no debugger`, () => {
    const suggested = commands({
      runtimeSupported: false,
      outcome: 'inconclusive',
      platform: 'android',
    });

    expect(suggested).not.toContain('npx exagent smoke');
    // The other platform, which was measured to answer — not the same one again.
    expect(suggested.some((command) => command.includes('smoke --ios'))).toBe(true);
  });

  // @ref ../smoke — friction run 6, F55. This used to suggest `npx exagent dev --plan --android`
  // under "this prints what a development build would take". For a project Expo Go can still
  // serve, that command prints the **Expo Go** path: the plan engine only reaches the
  // development-build steps when a native module makes Expo Go incompatible (`src/plan/decide.ts`).
  it(`does not claim that dev --plan prints a development build`, () => {
    const followups = buildSmokeFollowUps(
      input({ runtimeSupported: false, outcome: 'inconclusive', platform: 'android' })
    );

    expect(followups.map((followup) => followup.command)).not.toContain(
      'npx exagent dev --plan --android'
    );
    expect(followups.map((followup) => followup.why).join(' ')).not.toContain(
      'what a development build would take'
    );
  });

  // @ref llp/0005-runtime-loop-tools.rfc.md §Peer churn — an error window is a property of the
  // app's session and the session outlives a fix, so a reload leads.
  it(`leads a non-empty window with the reload`, () => {
    expect(commands({ failing: 1, outcome: 'failed' })[0]).toBe('npx exagent runtime:reload --ios');
  });

  // @ref llp/0010-agent-conventions.rfc.md §The fourth: `typecheck`. Nothing threw and the bundle
  // transformed, which is not the same as the code being right — a `Spacing.md` that evaluates to
  // undefined renders a screen with `padding: undefined` and every runtime gate green.
  it(`answers a pass with the gate this one is structurally blind to`, () => {
    expect(commands()[0]).toBe('npx exagent typecheck');
  });

  it(`points at the picture it took, when it took one`, () => {
    expect(commands()).toContain('open /project/.expo/exagent/smoke.png');
    expect(commands({ screenshotTaken: false, screenshotPath: null }).join(' ')).not.toContain(
      'open '
    );
  });

  it(`keeps the route on a re-run it suggests`, () => {
    expect(commands({ devServerFound: false, route: '/notes' })).toContain(
      'npx exagent smoke --start --ios --route /notes'
    );
    expect(commands({ bundleBroken: true, outcome: 'failed', route: '/notes' })).toContain(
      'npx exagent smoke --ios --route /notes'
    );
  });
});
