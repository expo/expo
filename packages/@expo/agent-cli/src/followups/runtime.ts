// @ref llp/0009-smart-followups.rfc.md §Examples per command — the runtime loop.
// The two outcomes of `runtime:errors` need opposite next steps: errors mean "fix, then prove the
// window is clean"; an empty window means "the failure was probably never reproduced".

import { PROGRAM_PREFIX } from '../programName';
import { capFollowUps, type FollowUp } from './types';

export interface RuntimeErrorsFollowUpInput {
  /** How many errors the window collected. */
  count: number;
  /** The window that was listened on, in milliseconds. */
  durationMs: number;
  /**
   * The platform this window read, when the caller named one.
   *
   * @ref llp/0005-runtime-loop-tools.rfc.md §navigate — F54, F58, F103.
   * Every command a follow-up names carries the flag the run had, and this builder was the one that
   * did not: on a dev server with a simulator and an emulator on it, a flagless rerun asks about a
   * different app than the one that was just read.
   */
  platform?: 'ios' | 'android' | null;
}

export function buildRuntimeErrorsFollowUps({
  count,
  durationMs,
  platform,
}: RuntimeErrorsFollowUpInput): FollowUp[] {
  const flag = platform == null ? '' : ` --${platform}`;

  // @ref llp/0005-runtime-loop-tools.rfc.md §Reloading the app
  // is a trap this command used to walk agents into [observed — friction run 3, F31]: an app whose
  // component threw while rendering is not recovered by Fast Refresh, so after the fix the *same*
  // errors keep arriving from the run that is still going. Re-running this command first reads the
  // old run and reports the bug as unfixed.
  if (count > 0) {
    return capFollowUps([
      {
        id: 'reload-app',
        command: `${PROGRAM_PREFIX} runtime:reload${flag}`,
        why: 'Fix the errors above, then reload: an app whose render threw keeps running the code from before the fix, and this window would keep reporting it.',
      },
      {
        id: 'runtime-errors-rerun',
        command: `${PROGRAM_PREFIX} runtime:errors${flag} --duration ${durationMs}`,
        why: 'Reproduce the same steps against the reloaded app, and confirm this window stays empty.',
      },
    ]);
  }

  // An empty window means "nothing happened while I watched", and the reading it invites is "the
  // app is fine". The rung that contradicts that reading belongs here rather than anywhere else:
  // the bug this command cannot see does not throw at all (llp/0009 §Where the typecheck rung
  // goes).
  return capFollowUps([
    {
      id: 'runtime-errors-reproduce',
      command: `${PROGRAM_PREFIX} runtime:errors${flag} --duration ${durationMs * 2}`,
      why: 'Errors thrown before this window are not captured, so reproduce the problem while a longer window listens.',
    },
    {
      id: 'runtime-errors-typecheck',
      command: `${PROGRAM_PREFIX} typecheck`,
      why: 'An empty window is not a healthy app: a property that does not exist is undefined rather than a throw, so the screen renders wrongly and nothing here reports it.',
    },
  ]);
}
