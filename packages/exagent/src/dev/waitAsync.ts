// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// What `exagent dev:wait` does: find the dev server, hold one request open until its bundler
// finishes, and answer three questions an agent cannot otherwise ask — is the bundle built, is it
// this project's bundle, and is an app running it.
//
// The exit code is the answer. `0` ready, `22` the budget expired (inconclusive: wait longer),
// `20` the dev server answered but not as an Expo dev server does, `1` there was no dev server to
// wait on at all. Only the last is a failure of the *tool*; the others are outcomes, so they are
// reported and exited with rather than thrown.

import { event } from '../events';
import { EXIT_OK, EXIT_OUTCOME_FAILED, EXIT_OUTCOME_TIMEOUT } from '../exitCodes';
import { buildDevWaitFollowUps, followUpsEnabled, reportFollowUps } from '../followups';
import * as Log from '../log';
import { discoverDevServerAsync } from '../runtime/devServer';
import { waitForAppConnectionAsync, waitForBundlerReadyAsync } from '../runtime/waitReady';
import { CommandError } from '../utils/errors';
import type { DevWaitOptions } from './resolveWaitOptions';
import {
  devWaitResultToJson,
  devWaitSucceeded,
  formatDevWaitResult,
  type DevWaitResult,
} from './waitFormat';

/**
 * How long discovery may spend on each candidate port before moving on.
 *
 * Short on purpose, and unrelated to `--timeout`: the whole budget belongs to the bundle, and a
 * dev server that is up answers its target list in a millisecond.
 */
const DISCOVERY_TIMEOUT_MS = 800;

/**
 * Wait for the dev server to be ready, and report what was found.
 *
 * @returns the exit code, per llp/0010 §Exit codes.
 * @throws {CommandError} `NO_DEV_SERVER` when nothing answered, which is the one case where there
 * was nothing to wait on and so nothing to report.
 */
export async function devWaitAsync(projectRoot: string, options: DevWaitOptions): Promise<number> {
  const startedAt = Date.now();
  const discovery = await discoverDevServerAsync(options.devServerUrl ?? undefined, {
    timeoutMs: DISCOVERY_TIMEOUT_MS,
    projectRoot,
  });

  if (!discovery.reachable) {
    throw noDevServerError(discovery.devServerUrl, discovery.reason, options.devServerUrl != null);
  }

  // One long-lived request, not a poll: `/status` answers when the bundler does, so a poll would
  // abandon a wait that was nearly over and start it again (see `runtime/waitReady.ts`).
  const readiness = await waitForBundlerReadyAsync(discovery.devServerUrl, {
    timeoutMs: options.timeoutMs,
    projectRoot,
  });

  let appsConnected = discovery.targets.length;
  let timedOut = readiness.timedOut;
  // The app can only attach to a bundle that exists, so this waits on what is left of the budget
  // rather than on a budget of its own.
  if (options.requireApp && readiness.ready) {
    const remainingMs = Math.max(0, options.timeoutMs - (Date.now() - startedAt));
    const attached = await waitForAppConnectionAsync(discovery.devServerUrl, {
      timeoutMs: remainingMs,
    });
    appsConnected = attached.appsConnected;
    timedOut = attached.timedOut;
  }

  const result: DevWaitResult = {
    devServerUrl: discovery.devServerUrl,
    source: discovery.source,
    ready: readiness.ready,
    projectRootMatched: readiness.projectRootMatched,
    reportedProjectRoot: readiness.reportedProjectRoot,
    projectRoot,
    appsConnected,
    waitedMs: Date.now() - startedAt,
    timedOut,
    requireApp: options.requireApp,
    ...(readiness.reason ? { reason: readiness.reason } : {}),
  };

  event('dev_wait', {
    devServerUrl: result.devServerUrl,
    source: result.source,
    ready: result.ready,
    projectRootMatched: result.projectRootMatched,
    appsConnected: result.appsConnected,
    waitedMs: result.waitedMs,
    timedOut: result.timedOut,
  });

  const followups = followUpsEnabled(options.followups)
    ? buildDevWaitFollowUps({
        ready: result.ready,
        timedOut: result.timedOut,
        projectRootMatched: result.projectRootMatched,
        appsConnected: result.appsConnected,
        timeoutMs: options.timeoutMs,
      })
    : [];

  if (options.json) {
    Log.log(JSON.stringify(devWaitResultToJson(result, followups), null, 2));
  } else {
    Log.log(formatDevWaitResult(result));
  }
  reportFollowUps('dev:wait', followups, { json: options.json });

  return exitCodeFor(result);
}

/**
 * The exit code one result deserves.
 *
 * The distinction that matters to a caller is between "not yet" and "not this": a budget that
 * expired is worth waiting on again, and a port that answers with something other than a bundler
 * never will be (llp/0010 §Exit codes).
 *
 * A dev server that serves another project is checked before the timeout, because it is the one
 * failure a longer wait cannot fix: the mismatch was *decided*, not left open, so reporting it as
 * `22` would invite the retry that is guaranteed to fail again.
 */
function exitCodeFor(result: DevWaitResult): number {
  if (devWaitSucceeded(result)) {
    return EXIT_OK;
  }
  if (result.projectRootMatched === false) {
    return EXIT_OUTCOME_FAILED;
  }
  return result.timedOut ? EXIT_OUTCOME_TIMEOUT : EXIT_OUTCOME_FAILED;
}

/**
 * Nothing answered on the URL that was named or found.
 *
 * A tool error rather than an outcome: there was no dev server to wait on, so the command never
 * got to ask its question, and a caller that retried the same wait would wait on nothing again.
 */
function noDevServerError(
  devServerUrl: string,
  reason: string | undefined,
  explicit: boolean
): CommandError {
  const error = new CommandError(
    'NO_DEV_SERVER',
    [
      `No Expo dev server answered at ${devServerUrl}, so there is nothing to wait for.`,
      `Why: the request for its debugger target list failed (${reason ?? 'no answer'}).${
        explicit
          ? ''
          : ` The project's dev-server lock, the port in its start.log, 8081 and the ports "expo start" falls back to were all tried.`
      }`,
      `How: start a dev server with "npx exagent dev" and run this command again, or pass --dev-server-url to wait on a dev server on another host or port.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent dev';
  return error;
}
