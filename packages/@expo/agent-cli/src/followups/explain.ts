// @ref llp/0009-smart-followups.rfc.md §Examples per command
// What to do after a build log has been read. The first rung is whatever the matched rule named,
// because a rule that knows the failure knows the fix better than any general ladder does.

import type { Failure, PhaseName } from '../builds/explain/types';
import { PROGRAM_PREFIX } from '../programName';
import { capFollowUps, type FollowUp } from './types';

export interface ExplainFollowUpInput {
  failure: Failure | null;
  /** The phase the failure landed in, or null when nothing was located. */
  phase: PhaseName | null;
  /** True when the caller did not pass `--all`, so there may be more in the log. */
  moreMayExist: boolean;
  /**
   * How this run read its log, so a re-run rung is a command that actually runs.
   *
   * A follow-up is the next thing to *run* ([[0009-smart-followups]]), and
   * `npx @expo/agent-cli inspect:build-log --all` with no source would be read from a terminal's stdin and
   * fail with `BAD_ARGS`. The `--file` form is re-runnable; a piped one is not, because the
   * bytes are gone — so a stdin run gets the rung with the pipe spelled back out.
   */
  source: { kind: 'file'; path: string } | { kind: 'stdin' };
}

/** How to spell this run's log on a command line, for a rung the caller can paste. */
function sourceArgs(source: ExplainFollowUpInput['source']): string {
  return source.kind === 'file' ? `--file ${source.path}` : '--stdin';
}

/**
 * The next rungs after an explanation.
 *
 * Ordered most-specific first, because only the first {@link MAX_FOLLOWUPS} are printed: the fix
 * the rule named beats the phase-shaped advice, which beats "read the rest yourself".
 */
export function buildExplainFollowUps({
  failure,
  phase,
  moreMayExist,
  source,
}: ExplainFollowUpInput): FollowUp[] {
  const followups: FollowUp[] = [];
  const rerun = `${PROGRAM_PREFIX} inspect:build-log ${sourceArgs(source)}`;

  if (!failure) {
    // Nothing was located, and the honest next step is the one that reads more of the log rather
    // than one that acts on a diagnosis nobody has.
    followups.push({
      id: 'explain-all',
      command: `${rerun} --all --context 40`,
      why: 'No rule matched this log; a wider window is the next thing to look at before acting.',
    });
    return capFollowUps(followups);
  }

  if (failure.suggestedCommand) {
    followups.push({
      id: 'apply-fix',
      command: failure.suggestedCommand,
      why: `${failure.message} This is what the "${failure.signature}" rule says to run.`,
    });
  }

  if (failure.docsUrl) {
    followups.push({
      id: 'open-docs',
      command: failure.docsUrl,
      why: 'The Expo docs page for this class of failure.',
    });
  }

  // The gates this CLI already has, for the phases where they answer the same question the build
  // just failed on. A JavaScript failure is reproducible in seconds locally; a native one is not.
  if (phase === 'bundle-js') {
    followups.push({
      id: 'typecheck',
      command: `${PROGRAM_PREFIX} typecheck`,
      why: 'The bundle failed on a source file; this reports every other one before the next build.',
    });
  } else if (phase === 'prebuild') {
    followups.push({
      id: 'config-effective',
      command: `${PROGRAM_PREFIX} inspect:config-plugins`,
      why: 'Prebuild failed while resolving the app config; this prints what the plugins produced.',
    });
  }

  if (moreMayExist && followups.length < 3) {
    followups.push({
      id: 'explain-all',
      command: `${rerun} --all`,
      why: 'This report is about the first failure in the failing phase; --all lists the rest.',
    });
  }

  return capFollowUps(followups);
}
