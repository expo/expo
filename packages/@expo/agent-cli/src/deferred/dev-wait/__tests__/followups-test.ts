// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
import { buildDevWaitFollowUps, type DevWaitFollowUpInput } from '../followups';

function input(overrides: Partial<DevWaitFollowUpInput> = {}): DevWaitFollowUpInput {
  return {
    ready: true,
    timedOut: false,
    projectRootMatched: true,
    appsConnected: 1,
    timeoutMs: 120_000,
    ...overrides,
  };
}

const ids = (followups: { id: string }[]) => followups.map((followup) => followup.id);

describe(buildDevWaitFollowUps, () => {
  it(`should point a ready bundle with a connected app at the error window`, () => {
    expect(ids(buildDevWaitFollowUps(input()))).toEqual([
      'dev-wait-runtime-errors',
      'dev-wait-typecheck',
    ]);
  });

  // The old suggestion here was to re-run the identical wait, which is the one action that cannot
  // change the answer: something has to open the app first.
  it(`should name the command that opens the app, not the wait that just failed`, () => {
    const followups = buildDevWaitFollowUps(input({ appsConnected: 0 }));

    expect(ids(followups)).toEqual(['dev-wait-open-app', 'dev-wait-require-app']);
    expect(followups[0]!.command).toBe('npx @expo/agent-cli navigate /');
    // The gate is the step *after* the open, so it is second and never on its own.
    expect(followups[1]!.command).toContain('--require-app');
  });

  it(`should offer twice the budget after a wait that expired`, () => {
    const followups = buildDevWaitFollowUps(
      input({ ready: false, timedOut: true, appsConnected: 0, timeoutMs: 30_000 })
    );

    expect(ids(followups)).toEqual(['dev-wait-longer', 'dev-wait-status']);
    expect(followups[0]!.command).toBe('npx @expo/agent-cli dev:wait --timeout 60000');
  });

  // Every other suggestion would confirm something about another app's bundle, so this one wins
  // whatever else the wait found.
  it(`should put the wrong project first, even on a ready bundler`, () => {
    expect(ids(buildDevWaitFollowUps(input({ projectRootMatched: false })))).toEqual([
      'dev-wait-other-project',
    ]);
    expect(
      ids(buildDevWaitFollowUps(input({ projectRootMatched: false, ready: false, timedOut: true })))
    ).toEqual(['dev-wait-other-project']);
  });

  it(`should send a port that answered with something else to status`, () => {
    expect(ids(buildDevWaitFollowUps(input({ ready: false, timedOut: false })))).toEqual([
      'dev-wait-status',
    ]);
  });

  // Nothing else is worth doing until the code compiles, so this wins over every suggestion that
  // assumes a working app — including the ones a ready bundler and a connected app would produce.
  describe('a bundle that does not compile', () => {
    const broken = (filename: string | null, lineNumber: number | null) =>
      input({
        bundle: {
          outcome: 'broken',
          platform: 'ios',
          url: 'http://127.0.0.1:8081/index.bundle?platform=ios',
          waitedMs: 900,
          error: {
            type: 'TransformError',
            filename,
            lineNumber,
            column: 2,
            message: "SyntaxError: Unexpected keyword 'const'.",
            snippet: null,
          },
        },
      });

    it(`should name the file and the line to fix`, () => {
      const followups = buildDevWaitFollowUps(broken('src/app/index.tsx', 101));

      expect(ids(followups)).toEqual(['dev-wait-bundle-broken']);
      expect(followups[0]!.why).toContain('src/app/index.tsx:101');
      // Re-running the gate is the check, not a restart: the dev server rebuilds on save.
      expect(followups[0]!.command).toBe('npx @expo/agent-cli dev:wait');
    });

    it(`should still be usable when the bundler named no file`, () => {
      const followups = buildDevWaitFollowUps(broken(null, null));

      expect(ids(followups)).toEqual(['dev-wait-bundle-broken']);
      expect(followups[0]!.why).toContain('the file the bundler named');
    });

    // The one thing that outranks it: a bundle belonging to another project is not this project's
    // problem to fix, and the check never runs for one anyway.
    it(`should lose to another project's dev server`, () => {
      expect(
        ids(
          buildDevWaitFollowUps({ ...broken('src/app/index.tsx', 101), projectRootMatched: false })
        )
      ).toEqual(['dev-wait-other-project']);
    });
  });

  // @ref llp/0010-agent-conventions.rfc.md §Exit codes — F40.
  // A web wait's follow-ups used to drop `--platform web` and name `runtime:errors`, which reads
  // the *native* runtime through the debugger — a different app on a different platform.
  describe('a web wait', () => {
    const web = (overrides: Partial<DevWaitFollowUpInput> = {}) =>
      buildDevWaitFollowUps(
        input({
          platform: 'web',
          appsConnected: null,
          devServerUrl: 'http://127.0.0.1:8081',
          ...overrides,
        })
      );

    it(`should not send a web wait to the native runtime's error window`, () => {
      const followups = web();

      expect(ids(followups)).not.toContain('dev-wait-runtime-errors');
      expect(followups.map((followup) => followup.command).join('\n')).not.toContain(
        'runtime:errors'
      );
    });

    it(`should name the page to open, and keep typecheck`, () => {
      const followups = web();

      expect(ids(followups)).toEqual(['dev-wait-web-open', 'dev-wait-typecheck']);
      expect(followups[0]!.command).toContain('http://127.0.0.1:8081');
    });

    it(`should keep --platform web on every wait it suggests re-running`, () => {
      const rerun = [
        ...web({ ready: false, timedOut: true }),
        ...web({
          bundle: {
            outcome: 'broken',
            platform: 'web',
            url: null,
            waitedMs: 5,
            error: {
              type: 'TransformError',
              filename: 'src/app/index.tsx',
              lineNumber: 3,
              column: 1,
              message: 'SyntaxError',
              snippet: null,
            },
          },
        }),
      ].filter((followup) => followup.command.includes('dev:wait'));

      expect(rerun.length).toBeGreaterThan(0);
      for (const followup of rerun) {
        expect(followup.command).toContain('--platform web');
      }
    });
  });

  it.each([['ok'], ['unknown'], ['timeout']] as const)(
    `should suggest nothing about the bundle when the check answered %p`,
    (outcome) => {
      const followups = buildDevWaitFollowUps(
        input({
          bundle: { outcome, platform: 'ios', url: null, error: null, waitedMs: 10 },
        })
      );

      expect(ids(followups)).not.toContain('dev-wait-bundle-broken');
    }
  );

  // @ref llp/0017-deferred-commands.reference.md §dev:wait. "Open it on the booted simulator
  // or the attached device" is an instruction that cannot work on the machine this backend is for.
  it(`aims the open-app rung at the session when this machine has no device`, () => {
    const followups = buildDevWaitFollowUps(
      input({ ready: true, appsConnected: 0, openOn: 'cloud' })
    );
    const openApp = followups.find((followup) => followup.id === 'dev-wait-open-app');

    expect(openApp?.command).toBe('npx @expo/agent-cli navigate / --cloud');
    expect(openApp?.why).toContain('EAS Simulator session');
    expect(openApp?.why).toContain('bills until');
  });

  it(`keeps the local wording when this machine has a device`, () => {
    const followups = buildDevWaitFollowUps(input({ ready: true, appsConnected: 0 }));

    expect(followups.find((followup) => followup.id === 'dev-wait-open-app')?.command).toBe(
      'npx @expo/agent-cli navigate /'
    );
  });
});
