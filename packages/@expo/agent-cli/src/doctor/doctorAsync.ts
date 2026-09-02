// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// @ref llp/0016-v1-scope.rfc.md §Doctor's exit code
//
// `doctor:check` wraps a tool that has an exit-code contract of its own: `expo-doctor` exits 1 when
// any check fails [observed — `packages/expo-doctor/src/doctor.ts` ends on `Log.exit`]. This command
// used to mirror that code, on the argument that hiding the tool's own answer would be worse.
//
// **The protocol wins** [decided — wave 17, friction run 7's F68]. `1` means "the tool did not
// work" everywhere else in this surface, and `doctor` was the only gate that used it for "the tool
// worked and the project has a problem" — the same outcome `typecheck` and `smoke` report as `20`.
// An agent branching on exit codes could not use `doctor` as a gate at all without parsing prose.
// Nothing is hidden by the change: expo-doctor's own code stays on the `exitCode` field of the
// report and on the `cli:doctor_check` event.

import { event } from '../events';
import { EXIT_ERROR, EXIT_OK, EXIT_OUTCOME_FAILED } from '../exitCodes';
import { buildDoctorCheckFollowUps, followUpsEnabled, reportFollowUps } from '../followups';
import * as Log from '../log';
import { runDoctorCheckAsync } from './checkAsync';
import { formatDoctorReport } from './format';
import type { DoctorReportPayload } from './types';

export interface DoctorCheckOptions {
  json?: boolean;
  /** Attach the state-aware next actions, cleared by `--no-followups`. */
  followups?: boolean;
}

/**
 * Run the checks and report them on all three channels.
 *
 * @returns the exit code to leave with: `0` when every check passed, `20` when any failed, and `1`
 * only for a run that produced no code of its own — a signalled or killed check established
 * nothing about the project, which is a tool failure rather than a verdict.
 */
export async function printDoctorCheckAsync(
  projectRoot: string,
  options: DoctorCheckOptions
): Promise<number> {
  const report = await runDoctorCheckAsync(projectRoot);

  // Counts and the parse quality only: the issue text belongs to the caller's answer, and a
  // project's dependency versions are not something to put on a telemetry stream.
  event('doctor_check', {
    passed: report.passed,
    failed: report.failed,
    parse: report.parse,
    exitCode: report.exitCode,
  });

  const followups = followUpsEnabled(options.followups) ? buildDoctorCheckFollowUps(report) : [];

  if (options.json) {
    const payload: DoctorReportPayload = { ...report, followups };
    Log.log(JSON.stringify(payload, null, 2));
  } else {
    Log.log(formatDoctorReport(report));
  }

  reportFollowUps('doctor:check', followups, { json: !!options.json });

  // A signalled or never-started run has no code of its own; `runDoctorCheckAsync` already threw
  // for the second case, so this is the first one — and a check that was stopped mid-run is a tool
  // that did not work, not a project that failed.
  if (report.exitCode == null) {
    return EXIT_ERROR;
  }
  return report.exitCode === 0 ? EXIT_OK : EXIT_OUTCOME_FAILED;
}
