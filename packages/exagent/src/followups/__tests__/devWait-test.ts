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

  it(`should ask for the app to be opened when the bundle has nobody running it`, () => {
    const followups = buildDevWaitFollowUps(input({ appsConnected: 0 }));

    expect(ids(followups)).toEqual(['dev-wait-open-app']);
    expect(followups[0]!.command).toContain('--require-app');
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
});
