// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
// @ref llp/0009-smart-followups.rfc.md §Examples per command — a wait that ended is never the last
// rung: every outcome has a different next command, and the outcome is exactly what this command
// spent its time learning.

import { capFollowUps, type FollowUp } from '../../followups/types';
import { PROGRAM_PREFIX } from '../../programName';

export interface BuildWaitFollowUpInput {
  kind: 'build' | 'submission';
  id: string;
  outcome: 'finished' | 'errored' | 'canceled' | 'timeout';
  /** Platform as EAS spelled it, e.g. `IOS`. Null when the payload never named one. */
  platform: string | null;
  /** The `eas.json` profile the build ran with, when the payload named one. */
  buildProfile: string | null;
  /** Where the build's own page is, from `artifacts.buildUrl`. */
  buildUrl: string | null;
  /** The docs page EAS attached to the failure, from `error.docsUrl`. */
  errorDocsUrl: string | null;
  /** The timeout the wait ran with, so a longer one can be suggested in the same units. */
  timeoutMs: number;
}

/** How much longer a timed-out wait is told to wait, when it tries again. */
const TIMEOUT_MULTIPLIER = 2;

/**
 * The next rungs after the wait that just ended.
 *
 * Ordered most-specific first, because only the first {@link MAX_FOLLOWUPS} are printed: the thing
 * this particular outcome makes possible comes before the generic "look at the build".
 */
export function buildBuildWaitFollowUps({
  kind,
  id,
  outcome,
  platform,
  buildProfile,
  buildUrl,
  errorDocsUrl,
  timeoutMs,
}: BuildWaitFollowUpInput): FollowUp[] {
  const followups: FollowUp[] = [];
  const view = kind === 'submission' ? 'submit:view' : 'build:view';

  if (outcome === 'finished') {
    if (buildUrl) {
      followups.push({
        id: 'open-build-page',
        command: buildUrl,
        why: `The ${kind} succeeded; its page has the artifact and everything EAS recorded about the run.`,
      });
    }
    if (kind === 'build') {
      followups.push({
        id: 'eas-build-download',
        command: `npx eas build:download --build-id ${id} --non-interactive`,
        why: 'Downloads the application archive this build produced, to install or submit it.',
      });
    }
  }

  if (outcome === 'errored') {
    if (errorDocsUrl) {
      followups.push({
        id: 'open-error-docs',
        command: errorDocsUrl,
        why: 'EAS classified this failure and linked the page that explains that class of error.',
      });
    }
    // The CLI's own view is the shortest path to the logs: it prints the error EAS recorded and
    // the URLs of the log files (llp/0010 §Upstream asks, `build:logs`).
    followups.push({
      id: 'eas-build-view',
      command: `npx eas ${view} ${id}`,
      why: `The ${kind} failed; this prints what EAS recorded about it, including where the logs are.`,
    });
    // And the explainer, for once the log is on disk — for a *build*, whose log is a native build
    // log the rule table was written against. The `why` is deliberate about the step in between:
    // this CLI cannot fetch the log itself, because eas-cli has no `build:logs` (llp/0010
    // §Upstream asks), and a follow-up that read as though it could would send an agent to run
    // `build:explain <id>`, which is exactly the form that does not work yet.
    if (kind === 'build') {
      followups.push({
        id: 'explain-saved-log',
        command: `${PROGRAM_PREFIX} build:explain --file <path>`,
        why: 'Once the log above is saved to a file, this locates the failing line in it and names the fix. Nothing here can download it for you yet.',
      });
    }
  }

  if (outcome === 'canceled') {
    if (kind === 'build' && platform) {
      followups.push({
        id: 'eas-build-restart',
        command: `npx eas build --platform ${platform.toLowerCase()}${buildProfile ? ` --profile ${buildProfile}` : ''}`,
        why: 'Nothing is known about whether this build would have succeeded; this starts the same one again.',
      });
    }
    followups.push({
      id: 'eas-build-view',
      command: `npx eas ${view} ${id}`,
      why: `Shows who canceled the ${kind} and when, so a deliberate stop is not retried.`,
    });
  }

  if (outcome === 'timeout') {
    followups.push({
      id: 'wait-longer',
      command: `${PROGRAM_PREFIX} build:wait ${id}${kind === 'submission' ? ' --submission' : ''} --timeout ${formatTimeout(timeoutMs * TIMEOUT_MULTIPLIER)}`,
      why: `The ${kind} had not finished when the wait expired, which is not a failure — this waits twice as long.`,
    });
    followups.push({
      id: 'eas-build-view',
      command: `npx eas ${view} ${id} --json`,
      why: `Answers "what is it doing now?" once, without waiting at all.`,
    });
  }

  return capFollowUps(followups);
}

/** A duration in the units a person would have typed it in, for a suggested command. */
function formatTimeout(milliseconds: number): string {
  if (milliseconds % 3_600_000 === 0) {
    return `${milliseconds / 3_600_000}h`;
  }
  if (milliseconds % 60_000 === 0) {
    return `${milliseconds / 60_000}m`;
  }
  if (milliseconds % 1_000 === 0) {
    return `${milliseconds / 1_000}s`;
  }
  return `${milliseconds}ms`;
}
