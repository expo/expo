// @ref llp/0010-agent-conventions.rfc.md §Exit codes — `typecheck` is in the outcome band.
//
// The command exists because every gate this CLI had was blind to one whole class of bug. A
// friction run finished a feature with `dev:wait` at 0, `runtime:errors --fail-on-error` at 0 and
// `doctor` at 21/21, then ran `npx tsc --noEmit` out of habit and found seven errors — among them
// `Spacing.md` on a constant that has no `md`, which is `undefined` at runtime, so the screen
// rendered with `padding: undefined` and every line of text flush against the left edge [observed —
// friction run 3, F34]. Nothing threw, so `runtime:errors` was right to report nothing; nothing
// failed to transform, so `dev:wait` was right too. The gap was that no command could see it.

import { event } from '../events';
import { EXIT_OK, EXIT_OUTCOME_FAILED } from '../exitCodes';
import { buildTypeCheckFollowUps, followUpsEnabled, reportFollowUps } from '../followups';
import * as Log from '../log';
import { runTypeCheckAsync } from './checkAsync';
import { formatTypeCheckReport } from './format';
import type { TypeCheckPayload } from './types';

export interface TypeCheckOptions {
  json?: boolean;
  /** Attach the state-aware next actions, cleared by `--no-followups`. */
  followups?: boolean;
}

/**
 * Type-check the project and report it on all three channels.
 *
 * @returns the exit code to leave with: `0` for a project that type-checks or has nothing to
 * check, `20` for one that does not (llp/0010 §Exit codes).
 */
export async function printTypeCheckAsync(
  projectRoot: string,
  options: TypeCheckOptions
): Promise<number> {
  const report = await runTypeCheckAsync(projectRoot);

  // Counts only: a diagnostic quotes the project's own identifiers and types, which is not
  // something to put on a telemetry stream.
  event('typecheck', {
    checked: report.checked,
    errorCount: report.errorCount,
    durationMs: report.durationMs,
  });

  const followups = followUpsEnabled(options.followups)
    ? buildTypeCheckFollowUps({
        checked: report.checked,
        errorCount: report.errorCount,
        generatedTypesCommand: report.generatedTypes?.command ?? null,
      })
    : [];

  if (options.json) {
    const payload: TypeCheckPayload = { ...report, followups };
    Log.log(JSON.stringify(payload, null, 2));
  } else {
    Log.log(formatTypeCheckReport(report));
  }

  reportFollowUps('typecheck', followups, { json: !!options.json });

  // A project with nothing to check exits 0, and says so in `checked`. The alternative — failing
  // for the absence of TypeScript — would make the gate red for every JavaScript project forever,
  // and a red that is not about the code is a red nobody can act on.
  return report.errorCount > 0 ? EXIT_OUTCOME_FAILED : EXIT_OK;
}
