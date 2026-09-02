// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
import { buildWaitReport } from '../buildWaitAsync';
import type { BuildWaitOptions } from '../resolveOptions';
import type { BuildWaitOutcome } from '../status';
import type { BuildViewPayload } from '../types';
import type { BuildWaitResult } from '../waitAsync';

const ID = 'build-1';

function options(overrides: Partial<BuildWaitOptions> = {}): BuildWaitOptions {
  return {
    id: ID,
    kind: 'build',
    timeoutMs: 45 * 60_000,
    intervalMs: 10_000,
    maxIntervalMs: 30_000,
    backoffAfterMs: 5 * 60_000,
    json: true,
    followups: true,
    ...overrides,
  };
}

function result(
  outcome: BuildWaitOutcome,
  payload: BuildViewPayload | null = null
): BuildWaitResult {
  return {
    outcome,
    status: (payload?.status as string) ?? null,
    payload,
    waitedMs: 743_000,
    polls: 74,
    interrupted: false,
  };
}

/** A finished build, in the shape `eas build:view --json` prints one. */
const FINISHED: BuildViewPayload = {
  id: ID,
  status: 'FINISHED',
  platform: 'IOS',
  buildProfile: 'production',
  appVersion: '1.2.0',
  appBuildVersion: '42',
  createdAt: '2026-08-23T10:00:00.000Z',
  completedAt: '2026-08-23T10:12:23.000Z',
  artifacts: { buildUrl: 'https://expo.dev/builds/1' },
  fingerprint: { hash: 'a1b2c3' },
  metrics: { buildWaitTime: 32, buildQueueTime: 118, buildDuration: 604 },
};

describe(buildWaitReport, () => {
  // The top-level keys are the de-facto version of this command (llp/0006 §Output contract).
  it(`pins the top-level keys of the payload`, () => {
    const report = buildWaitReport(options(), result('finished', FINISHED));

    expect(Object.keys(report)).toEqual([
      'kind',
      'id',
      'outcome',
      'status',
      'platform',
      'buildProfile',
      'waitedMs',
      'polls',
      'build',
      'followups',
    ]);
    expect(Object.keys(report.build).sort()).toEqual([
      'appBuildVersion',
      'appVersion',
      'artifacts',
      'completedAt',
      'createdAt',
      'error',
      'fingerprint',
      'metrics',
    ]);
  });

  it(`reports what the wait learned about a finished build`, () => {
    const report = buildWaitReport(options(), result('finished', FINISHED));

    expect(report).toMatchObject({
      kind: 'build',
      id: ID,
      outcome: 'finished',
      status: 'FINISHED',
      platform: 'IOS',
      buildProfile: 'production',
      waitedMs: 743_000,
      polls: 74,
      build: {
        error: null,
        artifacts: { buildUrl: 'https://expo.dev/builds/1' },
        fingerprint: { hash: 'a1b2c3' },
        metrics: { buildWaitTime: 32, buildQueueTime: 118, buildDuration: 604 },
        appVersion: '1.2.0',
        appBuildVersion: '42',
      },
    });
  });

  // An agent that reads `build.error` after a timeout must get null, not a missing key.
  it(`keeps the same key set whatever the wait ended as`, () => {
    const keys = Object.keys(buildWaitReport(options(), result('finished', FINISHED)));

    for (const outcome of ['errored', 'canceled', 'timeout'] as const) {
      expect(Object.keys(buildWaitReport(options(), result(outcome)))).toEqual(keys);
    }
  });

  it(`reports nulls rather than nothing when no poll ever answered`, () => {
    const report = buildWaitReport(options(), result('timeout'));

    expect(report).toMatchObject({
      outcome: 'timeout',
      status: null,
      platform: null,
      buildProfile: null,
      build: { error: null, artifacts: null, fingerprint: null, metrics: null },
    });
  });

  it(`attaches the next actions for the outcome it reports`, () => {
    const report = buildWaitReport(options(), result('finished', FINISHED));

    expect(report.followups.map((followup) => followup.id)).toEqual([
      'open-build-page',
      'eas-build-download',
    ]);
  });

  it(`computes no follow-ups at all when they are turned off`, () => {
    expect(
      buildWaitReport(options({ followups: false }), result('finished', FINISHED)).followups
    ).toEqual([]);
  });

  // The key set does not change with the flag: an empty list is still a list.
  it(`keeps the follow-ups key when they are turned off`, () => {
    const report = buildWaitReport(options({ followups: false }), result('errored', FINISHED));

    expect(Object.keys(report)).toContain('followups');
  });

  it(`names a submission as one`, () => {
    const report = buildWaitReport(
      options({ kind: 'submission' }),
      result('finished', { status: 'FINISHED', platform: 'ANDROID' })
    );

    expect(report).toMatchObject({ kind: 'submission', platform: 'ANDROID', buildProfile: null });
  });
});
