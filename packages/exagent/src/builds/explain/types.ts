// @ref llp/0012-build-explain.rfc.md
// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — the top-level keys of
// `ExplainReport` are the versioned surface of `inspect:build-log --json`, pinned by a shape test.

import type { FollowUp } from '../../followups/types';

/**
 * The segments a native build log is cut into.
 *
 * The vocabulary is the EAS Build step list, in the order those steps run [observed —
 * `docs/pages/build-reference/ios-builds.mdx` §Remote steps and
 * `docs/pages/build-reference/android-builds.mdx` §Remote steps]. A local `expo run:ios` or
 * `./gradlew` log has a subset of the same steps in the same order, which is what lets one
 * detector read both.
 *
 * `unknown` is the honest name for a line that no anchor claimed. It is a phase like any other,
 * so a failure found outside every recognised segment is still reported — with the lower
 * confidence that comes from not knowing where it happened.
 */
export type PhaseName =
  | 'install-dependencies'
  | 'prebuild'
  | 'pod-install'
  | 'bundle-js'
  | 'gradle'
  | 'xcodebuild'
  | 'fastlane'
  | 'archive'
  | 'upload'
  | 'unknown';

/**
 * What a phase did, as far as the log shows.
 *
 * Only the phase the failure was located in is `failed`. A phase a later phase started after is
 * `succeeded` — a build that moved on is a build that got past the step. The final phase of a log
 * with no located failure is `unknown`: it may have been cut off mid-stream, and claiming it
 * succeeded would be inventing the one fact the log is missing.
 */
export type PhaseStatus = 'succeeded' | 'failed' | 'unknown';

/** One segment of the log, with the line numbers a reader can jump to (1-based, inclusive). */
export interface Phase {
  name: PhaseName;
  status: PhaseStatus;
  startLine: number;
  endLine: number;
}

/**
 * How much of the answer the extractor is willing to stand behind.
 *
 * - `high` — a `cause` anchor matched inside a phase this log named. The line quoted is the thing
 *   that broke.
 * - `medium` — a `cause` anchor matched, but no phase anchor claimed the region around it, so the
 *   *where* is a guess even though the *what* is not.
 * - `low` — only a `summary` anchor matched: the tool's own after-the-fact report of a failure
 *   whose cause this table does not have a rule for. `logTail` is where the answer is.
 */
export type Confidence = 'high' | 'medium' | 'low';

/** The lines around a match, so a reader never has to open the log to make sense of it. */
export interface FailureContext {
  before: string[];
  /** The matched line itself, ANSI already stripped. */
  match: string;
  after: string[];
}

/** One located failure. */
export interface Failure {
  phase: PhaseName;
  /** Stable kebab id from the rule table, e.g. `ios.signing.no-team`. */
  signature: string;
  /** 1-based line number in the log as read, after truncation. */
  line: number;
  /** What broke, in one sentence, from the rule rather than from the log. */
  message: string;
  /** The line the rule matched, verbatim (ANSI stripped, whitespace-trimmed at the end). */
  matchedLine: string;
  context: FailureContext;
  confidence: Confidence;
  /** The next command, ready to paste. Null when the rule has no single right answer. */
  suggestedCommand: string | null;
  /** The Expo docs page for this class of failure, when there is one. */
  docsUrl: string | null;
}

/** Where the log came from, and what was actually read of it. */
export interface ExplainSource {
  kind: 'file' | 'stdin';
  /** Absolute path for `--file`; null for `--stdin`. */
  path: string | null;
  /** The platform hint the caller passed, which narrows the rule table. Null when none. */
  platform: 'ios' | 'android' | null;
  /** Bytes read off the stream. */
  bytes: number;
  /** Lines kept, which is what every `line` number in this report counts. */
  lines: number;
  /** True when the log was longer than the line budget and the *oldest* lines were dropped. */
  truncated: boolean;
  /** How many lines were dropped from the front. Zero when `truncated` is false. */
  droppedLines: number;
}

/** The one JSON object `inspect:build-log --json` prints. */
export interface ExplainReport {
  source: ExplainSource;
  phases: Phase[];
  /**
   * The failure this report is about, or null when the log holds nothing the table recognises.
   *
   * `null` is the in-band "the log was read and no error was located" answer, and it is still a
   * report: the command exits 0 and `logTail` carries the last lines so the caller has something
   * to read (llp/0012 §Exit codes).
   */
  failure: Failure | null;
  /** Every other match, when `--all` was passed. Always `[]` without it. */
  otherFailures: Failure[];
  /** The last lines of the log, always present, whether or not a failure was located. */
  logTail: string;
  followups: FollowUp[];
}
