// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0017 §doctor:fix
//
// @ref llp/0009-smart-followups.rfc.md §Examples per command
// The `Next:` rungs of `@expo/agent-cli doctor:fix`, lifted out of `src/followups/doctor.ts` when the
// command left the v1 surface. `doctor:check`'s own builder stayed there and never named this
// command, so nothing else moved with it.

import { capFollowUps, type FollowUp } from '../../followups/types';
import { PROGRAM_PREFIX } from '../../programName';
import type { FixPlanPayload } from './fixTypes';

/**
 * What to do after a `doctor:fix` run.
 *
 * The first rung is the one thing a dry run is missing: a dry run is a question, and `--apply` is
 * the answer. It is spelled with the tier the caller used, so the next command is a paste rather
 * than a re-read of `--help`.
 */
export function buildDoctorFixFollowUps(payload: FixPlanPayload): FollowUp[] {
  const followups: FollowUp[] = [];

  if (!payload.applied) {
    if (payload.steps.length) {
      followups.push({
        id: 'doctor-fix-apply',
        command: `${PROGRAM_PREFIX} doctor:fix --tier ${payload.tier} --apply`,
        why: `Nothing was deleted. This runs the ${payload.steps.length} ${payload.steps.length === 1 ? 'step' : 'steps'} above.`,
      });
    } else {
      followups.push({
        id: 'doctor-check',
        command: `${PROGRAM_PREFIX} doctor:check`,
        why: 'This tier found nothing stale, so whatever is wrong is not a cache.',
      });
    }
    // A caller who found nothing at this tier has one more tier to try, and naming it beats
    // leaving them to discover that tiers are cumulative.
    const next =
      payload.tier === 'safe' ? 'moderate' : payload.tier === 'moderate' ? 'aggressive' : null;
    if (next && !payload.steps.length) {
      followups.push({
        id: 'doctor-fix-next-tier',
        command: `${PROGRAM_PREFIX} doctor:fix --tier ${next}`,
        why: `The ${next} tier also resets ${next === 'moderate' ? 'the installed packages' : 'the generated native projects'}.`,
      });
    }
    return capFollowUps(followups);
  }

  const failed = payload.results?.find((result) => result.status === 'failed');
  if (failed) {
    followups.push({
      id: 'doctor-fix-retry-step',
      command: `${PROGRAM_PREFIX} doctor:fix --tier ${payload.tier} --apply`,
      why: `The "${failed.id}" step failed and the steps after it did not run. Fix what it reported, then run the rest.`,
    });
    return capFollowUps(followups);
  }

  // A reset removed the state the dev server reads, so the next thing anyone does is start one and
  // find out whether it helped. `dev` is what decides whether a rebuild is needed first.
  followups.push({
    id: 'dev',
    command: `${PROGRAM_PREFIX} dev`,
    why: 'The caches are gone; this rebuilds what the app needs and starts the dev server.',
  });
  if (payload.steps.some((step) => step.id === 'node-modules')) {
    followups.push({
      id: 'doctor-check',
      command: `${PROGRAM_PREFIX} doctor:check`,
      why: 'The packages were reinstalled, so this is the moment to check them against the SDK.',
    });
  }
  return capFollowUps(followups);
}
