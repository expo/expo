// @ref llp/0010-agent-conventions.rfc.md §Exit codes — a forwarded code is handed back verbatim.
//
// `doctor:check` is a wrapper around a tool that already has an exit-code contract: `expo-doctor`
// exits 1 when any check fails [observed — `packages/expo-doctor/src/doctor.ts` ends on `Log.exit`].
// Inventing a code of this CLI's own here would hide the one the tool reported, so the run mirrors
// it, exactly as `dev` mirrors `expo prebuild`.

import { event } from '../events';
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
 * @returns the exit code to leave with, which is `expo-doctor`'s own.
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
  // for the second case, so this is the first one, and a stopped check did not pass.
  return report.exitCode ?? 1;
}
