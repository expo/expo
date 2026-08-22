// @ref llp/0009-smart-followups.rfc.md §Examples per command — the runtime loop.
// The two outcomes of `runtime errors` need opposite next steps: errors mean "fix, then prove the
// window is clean"; an empty window means "the failure was probably never reproduced".

import { capFollowUps, type FollowUp } from './types';

export interface RuntimeErrorsFollowUpInput {
  /** How many errors the window collected. */
  count: number;
  /** The window that was listened on, in milliseconds. */
  durationMs: number;
}

export function buildRuntimeErrorsFollowUps({
  count,
  durationMs,
}: RuntimeErrorsFollowUpInput): FollowUp[] {
  if (count > 0) {
    return capFollowUps([
      {
        id: 'runtime-errors-rerun',
        command: `npx exagent runtime errors --duration ${durationMs}`,
        why: 'Fix the errors above, reproduce the same steps, and confirm this window stays empty.',
      },
    ]);
  }

  return capFollowUps([
    {
      id: 'runtime-errors-reproduce',
      command: `npx exagent runtime errors --duration ${durationMs * 2}`,
      why: 'Errors thrown before this window are not captured, so reproduce the problem while a longer window listens.',
    },
  ]);
}
