// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// What `@expo/agent-cli dev:wait` does: find the dev server, hold one request open until its bundler
// finishes, and answer four questions an agent cannot otherwise ask — is the bundler done, is it
// this project's dev server, does this project's own code compile, and is an app running it.
//
// The exit code is the answer. `0` ready, `22` the budget expired (inconclusive: wait longer),
// `20` the operation failed — another project's dev server, an entry bundle that does not compile,
// or something answering on the port that is not an Expo dev server — and `1` there was no dev
// server to wait on at all. Only the last is a failure of the *tool*; the others are outcomes, so
// they are reported and exited with rather than thrown.

import { readCloudSessionIdSync } from '../../device/cloudSimulator';
import { probeLocalDeviceAsync } from '../../device/localDevice';
import { event } from '../../events';
import { EXIT_OK, EXIT_OUTCOME_FAILED, EXIT_OUTCOME_TIMEOUT } from '../../exitCodes';
import { followUpsEnabled, reportFollowUps } from '../../followups';
import * as Log from '../../log';
import { PROGRAM_PREFIX } from '../../programName';
import {
  checkEntryBundleAsync,
  resolveBundleCheckPlatformsAsync,
  type BundleCheckResult,
} from '../../runtime/bundleCheck';
import { discoverDevServerAsync, howToNameTheDevServer } from '../../runtime/devServer';
import { waitForAppConnectionAsync, waitForBundlerReadyAsync } from '../../runtime/waitReady';
import { CommandError } from '../../utils/errors';
import { buildDevWaitFollowUps } from './followups';
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

  // @ref llp/0010-agent-conventions.rfc.md §Exit codes — friction run 4,
  // F40. The debugger target list is a list of native runtimes, so under `--platform web` it
  // answers a question about another platform. Null says so; the count is not reported reworded.
  const countsApps = options.platform !== 'web';
  let appsConnected: number | null = countsApps ? discovery.targets.length : null;
  let timedOut = readiness.timedOut;
  const remainingMs = () => Math.max(0, options.timeoutMs - (Date.now() - startedAt));

  // The one question that is about the project rather than about the dev server, and the reason
  // the whole command was reporting green on a build an agent had just broken. Skipped for a dev
  // server that is not this project's: building *their* entry bundle answers nothing about this
  // code, and it would spend the caller's whole budget doing it.
  // @ref llp/0005-runtime-loop-tools.rfc.md §Android — friction run 6, F53. Which platform to build
  // for is a question about the *app*, and this command used to answer it with a fixed default: an
  // Android-only break with an iOS app also attached was reported as "compiles for ios".
  const { platforms: bundlePlatforms, source: bundlePlatformSource } =
    await resolveBundleCheckPlatformsAsync(
      options.platformExplicit ? options.platform : null,
      discovery.targets,
      options.platform
    );

  const bundles: BundleCheckResult[] = [];
  if (options.bundleCheck && readiness.ready && readiness.projectRootMatched !== false) {
    for (const platform of bundlePlatforms) {
      bundles.push(
        await checkEntryBundleAsync(discovery.devServerUrl, {
          platform,
          timeoutMs: remainingMs(),
          // So the file the bundler names is reported the same way whichever platform answered.
          projectRoot,
        })
      );
    }
  }
  // A broken bundle decides the run whichever platform it was found on, which is the whole reason
  // more than one is built: the exit code has to be about the app that is broken.
  const bundle =
    bundles.find((entry) => entry.outcome === 'broken') ??
    bundles.find((entry) => entry.outcome === 'timeout') ??
    bundles[0] ??
    null;
  if (bundle?.outcome === 'timeout') {
    timedOut = true;
  }

  // The app can only attach to a bundle that exists, so this waits on what is left of the budget
  // rather than on a budget of its own. A bundle that does not compile is not waited on at all:
  // nothing can attach to it, so the wait would spend the rest of the budget to learn what the
  // line above already knows.
  if (options.requireApp && readiness.ready && bundle?.outcome !== 'broken' && !timedOut) {
    const attached = await waitForAppConnectionAsync(discovery.devServerUrl, {
      timeoutMs: remainingMs(),
      // Scoped when the caller named a native platform: `--require-app --platform android` used to
      // be satisfied by the iOS simulator attached to the same dev server (F51).
      platform:
        options.platformExplicit && options.platform !== 'web' ? options.platform : undefined,
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
    appsPlatform: countsApps ? null : options.platform,
    waitedMs: Date.now() - startedAt,
    timedOut,
    requireApp: options.requireApp,
    bundleCheck: options.bundleCheck,
    bundle,
    bundles,
    bundlePlatformSource,
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
    bundle: bundleEvent(bundle),
  });

  const followups = followUpsEnabled(options.followups)
    ? buildDevWaitFollowUps({
        ready: result.ready,
        timedOut: result.timedOut,
        projectRootMatched: result.projectRootMatched,
        appsConnected: result.appsConnected,
        timeoutMs: options.timeoutMs,
        bundle: result.bundle,
        platform: options.platform,
        devServerUrl: result.devServerUrl,
        openOn: await resolveOpenOnAsync(projectRoot, result),
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
  // Both of these are decided rather than pending, so they are checked before the timeout: a
  // longer wait cannot make another project's dev server this one's, and it cannot make a file
  // with a syntax error in it parse.
  if (result.projectRootMatched === false || result.bundle?.outcome === 'broken') {
    return EXIT_OUTCOME_FAILED;
  }
  return result.timedOut ? EXIT_OUTCOME_TIMEOUT : EXIT_OUTCOME_FAILED;
}

/** The bundle facts worth putting on the event stream: an outcome and a location, never a frame. */
function bundleEvent(bundle: BundleCheckResult | null) {
  return {
    outcome: bundle?.outcome ?? null,
    platform: bundle?.platform ?? null,
    filename: bundle?.error?.filename ?? null,
    lineNumber: bundle?.error?.lineNumber ?? null,
  };
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
      `How: start a dev server with "${PROGRAM_PREFIX} dev" and run this command again. ${howToNameTheDevServer(explicit)}`,
    ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} dev`;
  return error;
}

/**
 * Where the "open the app" rung should point.
 *
 * @ref llp/0017-deferred-commands.reference.md §dev:wait. Only asked when that rung is the one
 * that will be shown — the bundler is ready and nothing is attached — so a run that finishes green
 * pays for no device probe at all. The session comes from `.env.eas-simulator` rather than from the
 * service: a suggestion may not spawn a subprocess (llp/0005 §Cloud simulator).
 */
async function resolveOpenOnAsync(
  projectRoot: string,
  result: DevWaitResult
): Promise<'local' | 'cloud'> {
  if (!result.ready || result.appsConnected !== 0) {
    return 'local';
  }
  const local = await probeLocalDeviceAsync();
  // `absent` and not `unknown`: a tool that could not be started has said nothing about this
  // machine's devices, and re-aiming a suggestion on that would be the F49 mistake again.
  return local.state === 'absent' && readCloudSessionIdSync(projectRoot) != null
    ? 'cloud'
    : 'local';
}
