// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — the top-level keys of
// `BuildWaitReport` are the versioned surface of `build:wait --json`, pinned by a shape test.

import type { FollowUp } from '../../followups/types';
import type { BuildWaitOutcome } from './status';

/** What a wait is attached to. Two commands, one loop, two status enums that agree. */
export type BuildWaitKind = 'build' | 'submission';

/**
 * The parsed answer of one `eas build:view --json` / `eas submit:view --json`.
 *
 * Everything is optional and nothing is trusted: this is another CLI's payload, read across a
 * process boundary, and a field that moved must degrade to `null` in the report rather than throw
 * in the middle of a 45-minute wait.
 */
export interface BuildViewPayload {
  [key: string]: unknown;
}

/**
 * The fields of the polled object the report carries.
 *
 * A fixed key set, `null` where the payload had nothing: an agent branching on `build.error` must
 * not have to tell "the build did not fail" apart from "this key is missing today".
 */
export interface BuildWaitDetails {
  /** Why an errored build failed, as EAS classified it. */
  error: { errorCode: string | null; message: string | null; docsUrl: string | null } | null;
  /** Where the outputs are, for a build that produced any. */
  artifacts: {
    buildUrl: string | null;
    applicationArchiveUrl: string | null;
    buildArtifactsUrl: string | null;
    xcodeBuildLogsUrl: string | null;
  } | null;
  /** The fingerprint EAS computed for the build, which is what `impact` compares against. */
  fingerprint: { hash: string | null } | null;
  /** How the time was spent, in seconds, once the build is over. */
  metrics: {
    buildWaitTime: number | null;
    buildQueueTime: number | null;
    buildDuration: number | null;
  } | null;
  createdAt: string | null;
  completedAt: string | null;
  appVersion: string | null;
  appBuildVersion: string | null;
}

/** The one JSON object `build:wait --json` prints, and the whole of what the wait learned. */
export interface BuildWaitReport {
  kind: BuildWaitKind;
  id: string;
  outcome: BuildWaitOutcome;
  /** The last status observed, as EAS spelled it. Null when no poll ever answered. */
  status: string | null;
  platform: string | null;
  /** The `eas.json` profile the build ran with. Always null for a submission. */
  buildProfile: string | null;
  /** How long the wait ran, in milliseconds. */
  waitedMs: number;
  /** How many times the view command was run, failed polls included. */
  polls: number;
  build: BuildWaitDetails;
  followups: FollowUp[];
}

/** Progress of one poll, for the event stream. Every field is a real `BuildFragment` field. */
export interface BuildWaitProgress {
  status: string | null;
  /** Position in the build queue, or null once the build has left it. */
  queuePosition: number | null;
  estimatedWaitTimeLeftSeconds: number | null;
  /** How long the wait has been running when this poll answered. */
  elapsedMs: number;
}
