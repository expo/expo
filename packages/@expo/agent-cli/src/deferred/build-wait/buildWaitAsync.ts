// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// `@expo/agent-cli build:wait <id>`: attach to a build that already exists, and turn it into an exit code.
//
// The command is the exit code. `@expo/agent-cli build:wait $ID || handle_by_code $?` is the contract a CI
// job and a driving agent both want, and it is the reason this is a command rather than a loop
// pasted into a shell script: `0` finished, `20` errored, `21` canceled, `22` timed out, `1` the
// tool could not do its job.

import { event } from '../../events';
import { exitWithCodeAsync } from '../../exitCodes';
import { buildBuildWaitFollowUps, followUpsEnabled, reportFollowUps } from '../../followups';
import * as Log from '../../log';
import { assertSignedInAsync } from '../../needsHuman/assertAuth';
import { resolveEasCliOrThrow } from '../../utils/easCli';
import { formatBuildWaitReport } from './format';
import { readBuildDetails, readString } from './parseView';
import type { BuildWaitOptions } from './resolveOptions';
import { exitCodeForOutcome } from './status';
import type { BuildWaitReport } from './types';
import { pollBuildAsync, type BuildWaitResult } from './waitAsync';

/**
 * Wait for one EAS build or submission, and leave the process with what it did.
 *
 * @returns a promise that never settles: the wait ends by exiting.
 */
export async function buildWaitAsync(
  projectRoot: string,
  options: BuildWaitOptions
): Promise<never> {
  // Resolved before the first poll, so a missing EAS CLI is reported in milliseconds rather than
  // after the first interval — the same "check the preconditions first" rule as `deploy`.
  const easCli = resolveEasCliOrThrow(projectRoot);

  // @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol. A wait that nobody is
  // signed in for cannot see any build, so its three polls are three doomed subprocesses and a
  // "gave up waiting" that names the wrong cause [observed — friction run, 2026-08-23]. Asking
  // first turns that into one accurate answer, in about a second. A preflight that could not run
  // answers `null` and the wait proceeds exactly as before.
  await assertSignedInAsync(projectRoot, {
    action: `reading ${options.kind === 'submission' ? 'this submission' : 'this build'}`,
    because: 'a build is visible to the account that owns it, and to no one else',
  });

  const result = await pollBuildAsync(easCli, projectRoot, options);
  const report = buildWaitReport(options, result);
  const exitCode = exitCodeForOutcome(result.outcome);

  event('build_wait', {
    kind: options.kind,
    id: options.id,
    outcome: result.outcome,
    status: result.status,
    waitedMs: result.waitedMs,
    polls: result.polls,
    exitCode,
    interrupted: result.interrupted,
  });

  if (options.json) {
    Log.log(JSON.stringify(report, null, 2));
  } else {
    Log.log(formatBuildWaitReport(report, { interrupted: result.interrupted }));
  }

  reportFollowUps('build:wait', report.followups, { json: options.json });

  return exitWithCodeAsync(exitCode);
}

/**
 * The one JSON object the command prints, built from the last payload that parsed.
 *
 * Exported for the shape test: the top-level keys are the de-facto version of this command
 * (llp/0006 §Output contract), and they must not depend on how the wait ended — an agent that
 * reads `build.error` after a timeout gets `null`, not a missing key.
 */
export function buildWaitReport(
  options: BuildWaitOptions,
  result: BuildWaitResult
): BuildWaitReport {
  const { payload } = result;
  const build = readBuildDetails(payload);
  const platform = readString(payload, 'platform');
  const buildProfile = readString(payload, 'buildProfile');

  const followups = followUpsEnabled(options.followups)
    ? buildBuildWaitFollowUps({
        kind: options.kind,
        id: options.id,
        outcome: result.outcome,
        platform,
        buildProfile,
        buildUrl: build.artifacts?.buildUrl ?? null,
        errorDocsUrl: build.error?.docsUrl ?? null,
        timeoutMs: options.timeoutMs,
      })
    : [];

  return {
    kind: options.kind,
    id: options.id,
    outcome: result.outcome,
    status: result.status,
    platform,
    buildProfile,
    waitedMs: result.waitedMs,
    polls: result.polls,
    build,
    followups,
  };
}
