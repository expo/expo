// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
// The normalized shape of an `expo-doctor` run. `expo-doctor` has no `--json` and no stable check
// ids [observed — `packages/expo-doctor/src/index.ts` parses four flags and none of them is
// `--json`], so everything here is read back out of prose, and the report says how well that went.

import type { FollowUp } from '../followups/types';

/** What one check reported. `expo-doctor` has exactly these two outcomes. */
export type DoctorCheckStatus = 'passed' | 'failed';

/** One check of an `expo-doctor` run. */
export interface DoctorCheck {
  /** The check's description, which is the only name `expo-doctor` prints. */
  name: string;
  status: DoctorCheckStatus;
  /** What the check found, one entry per printed line. Empty for a passing check. */
  issues: string[];
  /** What the check says to do about it. Empty when the check printed no `Advice:` block. */
  advice: string[];
}

/**
 * How much of the output the parser understood.
 *
 * - `full` — every check the run reported is in {@link DoctorReport.checks}, with its issues.
 * - `best-effort` — the summary was found, but the check list is incomplete or did not line up.
 * - `failed` — nothing recognizable was found. `checks` is empty and `raw` is the whole answer.
 */
export type DoctorParseQuality = 'full' | 'best-effort' | 'failed';

/** What `parseDoctorOutput` reads out of one run's text. */
export interface ParsedDoctorOutput {
  passed: number;
  failed: number;
  checks: DoctorCheck[];
  parse: DoctorParseQuality;
}

/** The whole answer of `doctor:check`, minus the follow-ups the command attaches. */
export interface DoctorReport extends ParsedDoctorOutput {
  projectRoot: string;
  /** The exit code `expo-doctor` left with, which this command mirrors. */
  exitCode: number | null;
  /**
   * Everything `expo-doctor` printed, stdout and stderr interleaved, with ANSI codes removed.
   *
   * Always present, whatever `parse` says. A best-effort parse that drops information is worse
   * than one that keeps it: an agent can read the prose the parser could not.
   */
  raw: string;
}

/** What the command prints under `--json`. */
export interface DoctorReportPayload extends DoctorReport {
  followups: FollowUp[];
}
