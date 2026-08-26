// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0013
//
/* eslint-env jest */
// @ref llp/0013-doctor-fix.rfc.md §Follow-ups
import type { FixPlanPayload, FixStep, FixStepResult, FixTier } from '../fixTypes';
import { buildDoctorFixFollowUps } from '../followups';

function step(id: string): FixStep {
  return {
    id,
    kind: 'delete',
    targets: [`/project/${id}`],
    argv: null,
    cwd: null,
    scope: 'project',
    bytes: 1,
    reason: 'r',
    timeClass: 'seconds',
    recoverable: 'r',
  };
}

function payload(overrides: Partial<FixPlanPayload> = {}): FixPlanPayload {
  return {
    projectRoot: '/project',
    tier: 'safe' as FixTier,
    applied: false,
    platforms: ['ios'],
    packageManager: { name: 'npm', lockfile: null },
    steps: [step('expo-web-cache')],
    skipped: [],
    results: null,
    checkpoint: null,
    followups: [],
    ...overrides,
  };
}

function result(id: string, status: FixStepResult['status']): FixStepResult {
  return { id, status, durationMs: 1, detail: 'd' };
}

const ids = (followups: { id: string }[]) => followups.map((followup) => followup.id);

describe('buildDoctorFixFollowUps', () => {
  // A dry run is a question, and `--apply` is the answer. It carries the caller's own tier, so the
  // next command is a paste rather than a re-read of `--help`.
  it('offers the apply, with the tier that was asked for', () => {
    const followups = buildDoctorFixFollowUps(payload({ tier: 'moderate' }));

    expect(ids(followups)).toEqual(['doctor-fix-apply']);
    expect(followups[0]!.command).toBe('npx exagent doctor:fix --tier moderate --apply');
  });

  it('offers the next tier up when this one found nothing', () => {
    const followups = buildDoctorFixFollowUps(payload({ steps: [] }));

    expect(ids(followups)).toEqual(['doctor-check', 'doctor-fix-next-tier']);
    expect(followups[1]!.command).toBe('npx exagent doctor:fix --tier moderate');
  });

  it('has no tier left to offer above aggressive', () => {
    const followups = buildDoctorFixFollowUps(payload({ steps: [], tier: 'aggressive' }));

    expect(ids(followups)).toEqual(['doctor-check']);
  });

  it('sends a successful apply on to the dev server', () => {
    const followups = buildDoctorFixFollowUps(
      payload({ applied: true, results: [result('expo-web-cache', 'done')] })
    );

    expect(ids(followups)).toEqual(['dev']);
  });

  it('adds the SDK check when the packages were reinstalled', () => {
    const followups = buildDoctorFixFollowUps(
      payload({
        applied: true,
        tier: 'moderate',
        steps: [step('node-modules')],
        results: [result('node-modules', 'done')],
      })
    );

    expect(ids(followups)).toEqual(['dev', 'doctor-check']);
  });

  // A failed run must not be told to start a dev server: the reset it was doing did not finish.
  it('names the step that failed instead of moving on', () => {
    const followups = buildDoctorFixFollowUps(
      payload({
        applied: true,
        tier: 'moderate',
        steps: [step('node-modules')],
        results: [result('node-modules', 'failed'), result('metro-transform-cache', 'skipped')],
      })
    );

    expect(ids(followups)).toEqual(['doctor-fix-retry-step']);
    expect(followups[0]!.why).toContain('node-modules');
  });
});
