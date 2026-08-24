import { buildDevWaitFollowUps, type DevWaitFollowUpInput } from '../devWait';

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
    expect(ids(buildDevWaitFollowUps(input()))).toEqual(['dev-wait-runtime-errors']);
  });

  // The old suggestion here was to re-run the identical wait, which is the one action that cannot
  // change the answer: something has to open the app first.
  it(`should name the command that opens the app, not the wait that just failed`, () => {
    const followups = buildDevWaitFollowUps(input({ appsConnected: 0 }));

    expect(ids(followups)).toEqual(['dev-wait-open-app', 'dev-wait-require-app']);
    expect(followups[0]!.command).toBe('npx exagent navigate /');
    // The gate is the step *after* the open, so it is second and never on its own.
    expect(followups[1]!.command).toContain('--require-app');
  });

  it(`should offer twice the budget after a wait that expired`, () => {
    const followups = buildDevWaitFollowUps(
      input({ ready: false, timedOut: true, appsConnected: 0, timeoutMs: 30_000 })
    );

    expect(ids(followups)).toEqual(['dev-wait-longer', 'dev-wait-status']);
    expect(followups[0]!.command).toBe('npx exagent dev:wait --timeout 60000');
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
      expect(followups[0]!.command).toBe('npx exagent dev:wait');
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
});
