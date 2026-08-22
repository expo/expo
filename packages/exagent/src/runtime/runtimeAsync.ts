// @ref llp/0005-runtime-loop-tools.rfc.md
// The runtime loop: connect to the app through the dev server, evaluate an expression or listen
// for errors, and print the answer. This is the step that turns "I think the fix works" into
// "I read the value out of the running app".

import { event } from '../events';
import {
  buildRuntimeErrorsFollowUps,
  buildRuntimeNetworkFollowUps,
  followUpsEnabled,
  reportFollowUps,
} from '../followups';
import * as Log from '../log';
import { CommandError } from '../utils/errors';
import {
  CdpClient,
  isMethodNotFoundError,
  type CdpEvaluateResult,
  type CdpTarget,
} from './cdpClient';
import { requireConnectedAppAsync } from './devServer';
import {
  countFailedRequests,
  countPendingRequests,
  evaluateResultToJson,
  formatEvaluateResult,
  formatNetworkRequests,
  formatRuntimeErrors,
  networkRequestsToJson,
  runtimeErrorsToJson,
} from './format';
import {
  CdpNetworkCollector,
  NetworkDomainUnavailableError,
  targetAdvertisesNetworkPanel,
  type NetworkRequestRecord,
} from './networkCollector';
import type {
  RuntimeEvalOptions,
  RuntimeErrorsOptions,
  RuntimeNetworkOptions,
} from './resolveOptions';
import { CdpRuntimeErrorCollector, type RuntimeErrorRecord } from './runtimeErrorCollector';

/**
 * Evaluate an expression in the running app and print the value it returned.
 *
 * @returns the exit code: `1` when the expression threw inside the app, so a script can branch
 * on the outcome without parsing the output.
 */
export async function runtimeEvalAsync(options: RuntimeEvalOptions): Promise<number> {
  const { devServerUrl, expression, timeoutMs, awaitPromise, json } = options;
  await requireConnectedAppAsync(devServerUrl);

  let result: CdpEvaluateResult;
  try {
    result = await new CdpClient({ metroUrl: devServerUrl }).evaluateAsync(expression, {
      awaitPromise,
      timeoutMs,
    });
  } catch (error: unknown) {
    if (isMethodNotFoundError(error)) {
      throw evaluateUnsupportedError(devServerUrl);
    }
    throw new CommandError(
      'RUNTIME_EVALUATE_FAILED',
      [
        `Could not evaluate the expression in the app (dev server ${devServerUrl}).`,
        `Why: ${error instanceof Error ? error.message : String(error)}`,
        `How: make sure the app is open and connected to the dev server, then run this command again. Raise --timeout when the app is busy.`,
      ].join('\n')
    );
  }

  event('runtime_eval', {
    devServerUrl,
    threw: !!result.exceptionText,
    type: result.type ?? 'undefined',
  });

  if (json) {
    Log.log(JSON.stringify(evaluateResultToJson(devServerUrl, expression, result), null, 2));
  } else {
    Log.log(formatEvaluateResult(devServerUrl, result));
  }

  return result.exceptionText ? 1 : 0;
}

/**
 * The connected runtime has no `Runtime.evaluate` handler.
 *
 * Kept apart from `RUNTIME_EVALUATE_FAILED` because the two need opposite next steps: a failed
 * evaluate is worth retrying with a longer `--timeout`, while a missing handler never will be, and
 * a caller told to retry would loop.
 *
 * The known cause is a JavaScript engine built without the Chrome DevTools Protocol debugger, which
 * is what Expo Go for Android ships [observed — Expo Go 57.0.9, 2026-08-22]. On that runtime the
 * reading commands connect and report an empty window rather than failing, so the message says so
 * instead of promising that they work.
 */
function evaluateUnsupportedError(devServerUrl: string): CommandError {
  const error = new CommandError(
    'RUNTIME_EVALUATE_UNSUPPORTED',
    [
      `The app connected to ${devServerUrl} cannot evaluate JavaScript.`,
      `Why: its runtime answered Runtime.evaluate with "method not found". Expo Go for Android ships a JavaScript engine built without the Chrome DevTools Protocol debugger, so nothing can be evaluated in it, and "npx exagent runtime:errors" and "npx exagent runtime:network" connect to it but report an empty window. Expo Go on iOS answers all three.`,
      `How: run "npx exagent runtime:errors" to see whether this runtime reports anything at all. If that window is empty too, open the app in a development build ("npx exagent dev" prints the plan) or on iOS, either of which carries a debuggable engine.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent runtime:errors';
  return error;
}

/** Listen for runtime errors from the running app over a window and print what arrived. */
export async function runtimeErrorsAsync(options: RuntimeErrorsOptions): Promise<number> {
  const { devServerUrl, durationMs, json } = options;
  await requireConnectedAppAsync(devServerUrl);

  let errors: RuntimeErrorRecord[];
  try {
    errors = await new CdpRuntimeErrorCollector({
      metroUrl: devServerUrl,
      durationMs,
    }).collectAsync();
  } catch (error: unknown) {
    throw new CommandError(
      'RUNTIME_ERRORS_FAILED',
      [
        `Could not read runtime errors from the app (dev server ${devServerUrl}).`,
        `Why: ${error instanceof Error ? error.message : String(error)}`,
        `How: make sure the app is open and connected to the dev server, then run this command again.`,
      ].join('\n')
    );
  }

  event('runtime_errors', { devServerUrl, durationMs, count: errors.length });

  // @ref llp/0009-smart-followups.rfc.md §Examples per command — the two outcomes need opposite
  // next steps: errors mean "fix, then prove the window is clean", an empty window means the
  // failure was probably never reproduced inside it.
  const followups = followUpsEnabled(options.followups)
    ? buildRuntimeErrorsFollowUps({ count: errors.length, durationMs })
    : [];

  if (json) {
    Log.log(
      JSON.stringify(
        { ...runtimeErrorsToJson(devServerUrl, durationMs, errors), followups },
        null,
        2
      )
    );
  } else {
    Log.log(formatRuntimeErrors(devServerUrl, durationMs, errors));
  }
  reportFollowUps('runtime:errors', followups, { json });

  // Collected errors are a report, not a failure of the command: the app was reached and
  // answered. A caller that wants to fail on errors reads `count` from `--json`.
  return 0;
}

/**
 * Listen for the HTTP requests the app makes over a window and print what it asked for and got.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §Candidates — "Network inspection".
 */
export async function runtimeNetworkAsync(options: RuntimeNetworkOptions): Promise<number> {
  const { devServerUrl, durationMs, json } = options;
  const targets = await requireConnectedAppAsync(devServerUrl);

  let requests: NetworkRequestRecord[];
  try {
    requests = await new CdpNetworkCollector({
      metroUrl: devServerUrl,
      durationMs,
    }).collectAsync();
  } catch (error: unknown) {
    if (error instanceof NetworkDomainUnavailableError) {
      throw networkDomainUnavailableError(devServerUrl, error, targets);
    }
    throw new CommandError(
      'RUNTIME_NETWORK_FAILED',
      [
        `Could not read the network activity of the app (dev server ${devServerUrl}).`,
        `Why: ${error instanceof Error ? error.message : String(error)}`,
        `How: make sure the app is open and connected to the dev server, then run this command again.`,
      ].join('\n')
    );
  }

  const failedCount = countFailedRequests(requests);
  const pendingCount = countPendingRequests(requests);
  event('runtime_network', {
    devServerUrl,
    durationMs,
    count: requests.length,
    failedCount,
    pendingCount,
  });

  const followups = followUpsEnabled(options.followups)
    ? buildRuntimeNetworkFollowUps({
        count: requests.length,
        failedCount,
        pendingCount,
        durationMs,
      })
    : [];

  if (json) {
    Log.log(
      JSON.stringify(
        { ...networkRequestsToJson(devServerUrl, durationMs, requests), followups },
        null,
        2
      )
    );
  } else {
    Log.log(formatNetworkRequests(devServerUrl, durationMs, requests));
  }
  reportFollowUps('runtime:network', followups, { json });

  // Failed requests are a report, not a failure of the command: the app was reached and answered.
  // A caller that wants to fail on them reads the `failure` field of each request from `--json`.
  return 0;
}

/**
 * The runtime does not implement the CDP Network domain.
 *
 * Reported as its own error, never as an empty window: the domain is behind an unstable flag in
 * React Native's Fusebox, so "the app made no requests" and "this runtime cannot report requests"
 * are both plausible and lead to opposite next steps. The panel flag on the dev server's target is
 * named because it is the one piece of evidence a caller can check by hand.
 */
function networkDomainUnavailableError(
  devServerUrl: string,
  cause: NetworkDomainUnavailableError,
  targets: CdpTarget[]
): CommandError {
  const advertised = targets.some(targetAdvertisesNetworkPanel);
  const error = new CommandError(
    'NETWORK_DOMAIN_UNAVAILABLE',
    [
      `The app connected to ${devServerUrl} cannot report its network requests.`,
      `Why: it answered Network.enable with an error (${cause.reason}). Network inspection is an unstable part of the React Native debugger, so a runtime built without it has no request log to read. The dev server ${advertised ? 'does offer' : 'does not offer'} the network panel for this app.`,
      `How: read the app's runtime errors instead — a request that fails almost always throws or logs there — or wrap the call in your own logging and read the value with "npx exagent runtime:eval". Upgrading the app to a newer Expo SDK is what adds the domain.`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent runtime:errors';
  return error;
}
