// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0005
//
// The `runtime:network` half of `src/followups/__tests__/commands-test.ts`, moved with the code
// it covers. Not run: `jest.config.js` ignores this directory.

import { buildRuntimeNetworkFollowUps } from '../followups';

function ids(followups: { id: string }[]): string[] {
  return followups.map((followup) => followup.id);
}

describe(buildRuntimeNetworkFollowUps, () => {
  it(`should point at the error window first when a request failed`, () => {
    const followups = buildRuntimeNetworkFollowUps({
      count: 3,
      failedCount: 1,
      pendingCount: 0,
      durationMs: 5000,
    });

    expect(ids(followups)).toEqual(['runtime-network-errors', 'runtime-network-rerun']);
    expect(followups[0]!.command).toBe('npx exagent runtime:errors --duration 5000');
    expect(followups[1]!.command).toBe('npx exagent runtime:network --duration 5000');
  });

  it(`should ask for a longer window when the app made no request`, () => {
    const followups = buildRuntimeNetworkFollowUps({
      count: 0,
      failedCount: 0,
      pendingCount: 0,
      durationMs: 5000,
    });

    expect(ids(followups)).toEqual(['runtime-network-reproduce']);
    expect(followups[0]!.command).toBe('npx exagent runtime:network --duration 10000');
    expect(followups[0]!.why).toContain('trigger');
  });

  // A request the runtime never answered is the shape a connection error takes here: React Native
  // reports the rejection to JavaScript but sends no `loadingFailed`
  // [observed — SDK 57 / RN 0.86.2, 2026-08-22].
  it(`should explain a request the runtime never answered`, () => {
    const followups = buildRuntimeNetworkFollowUps({
      count: 2,
      failedCount: 0,
      pendingCount: 1,
      durationMs: 5000,
    });

    expect(ids(followups)).toEqual(['runtime-network-pending', 'runtime-network-rerun']);
    expect(followups[0]!.command).toBe('npx exagent runtime:errors --duration 5000');
    expect(followups[0]!.why).toContain('connection');
    expect(followups[1]!.command).toBe('npx exagent runtime:network --duration 10000');
  });

  // Every request answered, so a wrong screen is not a network problem: look at the app instead.
  it(`should send the caller to the app when every request answered`, () => {
    const followups = buildRuntimeNetworkFollowUps({
      count: 2,
      failedCount: 0,
      pendingCount: 0,
      durationMs: 5000,
    });

    expect(ids(followups)).toEqual(['runtime-network-clean']);
    expect(followups[0]!.command).toBe('npx exagent runtime:errors --duration 5000');
  });
});
