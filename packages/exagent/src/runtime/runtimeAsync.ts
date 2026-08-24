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
  CdpPromisePendingError,
  isMethodNotFoundError,
  type CdpEvaluateResult,
  type CdpTarget,
} from './cdpClient';
import { discoverDevServerAsync, requireConnectedAppAsync } from './devServer';
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
  classifyNetworkDomainRefusal,
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

export interface RuntimeContext {
  /**
   * Project the command was run in, when it was run in one.
   *
   * Only used to find the dev server: a project knows where its own dev server listens, and a
   * command that has no project to ask falls back to scanning ports.
   */
  projectRoot?: string | null;
}

/**
 * Which dev server this command talks to.
 *
 * A named URL is used as named — the caller was specific, so nothing is guessed around it. With
 * no URL, discovery asks the project's dev-server lock first and only then scans, so a dev server
 * that `exagent` started on a port other than 8081 is found instead of missed.
 *
 * @ref llp/0004-smart-start-and-project-state.rfc.md §`exagent status`
 */
async function resolveDevServerUrlAsync(
  options: { devServerUrl: string | null },
  { projectRoot }: RuntimeContext
): Promise<string> {
  if (options.devServerUrl != null) {
    return options.devServerUrl;
  }
  const discovery = await discoverDevServerAsync(undefined, {
    projectRoot: projectRoot ?? undefined,
  });
  return discovery.devServerUrl;
}

/**
 * Evaluate an expression in the running app and print the value it returned.
 *
 * @returns the exit code: `1` when the expression threw inside the app, so a script can branch
 * on the outcome without parsing the output.
 */
export async function runtimeEvalAsync(
  options: RuntimeEvalOptions,
  context: RuntimeContext = {}
): Promise<number> {
  const { expression, timeoutMs, awaitPromise, json } = options;
  const devServerUrl = await resolveDevServerUrlAsync(options, context);
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
    if (error instanceof CdpPromisePendingError) {
      throw promisePendingError(devServerUrl, expression, timeoutMs, error);
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
    promise: result.promise?.state ?? null,
  });

  if (json) {
    Log.log(JSON.stringify(evaluateResultToJson(devServerUrl, expression, result), null, 2));
  } else {
    Log.log(formatEvaluateResult(devServerUrl, result));
  }

  // A rejected promise is the asynchronous form of a throw, so it exits the same way: an agent
  // gating on `runtime:eval` must not read a failed `fetch` as a pass. The two are still told apart
  // in the report itself — `threw` for one, `promise.state` for the other.
  return result.exceptionText || result.promise?.state === 'rejected' ? 1 : 0;
}

/**
 * A promise the expression returned outlived the wait.
 *
 * Its own error rather than a report, because the command was asked for a settled value and has
 * none: reporting "pending" with exit 0 would let a caller act on a value that never arrived.
 * `--no-await-promise` is the way to ask for the pending answer on purpose, and it exits 0.
 */
function promisePendingError(
  devServerUrl: string,
  expression: string,
  timeoutMs: number,
  cause: CdpPromisePendingError
): CommandError {
  const error = new CommandError(
    'RUNTIME_PROMISE_PENDING',
    cause.lost
      ? [
          `The promise the expression returned was lost before it settled (dev server ${devServerUrl}).`,
          `Why: the app reloaded during the wait, which clears the globals this command parks the outcome on, so the value it resolved to — if it ever did — cannot be read any more.`,
          `How: run the expression again once the app has finished reloading ("npx exagent dev:wait --require-app" waits for that).`,
        ].join('\n')
      : [
          `The promise the expression returned had not settled after ${timeoutMs}ms (dev server ${devServerUrl}).`,
          `Why: the app is answering — it reported the promise and was polled until the wait ran out — so this is the promise taking longer than the budget, not a runtime that cannot be reached. A request to a slow host, or one waiting on something that never happens, both look like this.`,
          `How: give it longer with --timeout (for example --timeout 30s), or pass --no-await-promise to be told that a promise came back without waiting for it.`,
        ].join('\n')
  );
  error.suggestedCommand = `npx exagent runtime:eval ${JSON.stringify(expression)} --timeout 30s`;
  return error;
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
export async function runtimeErrorsAsync(
  options: RuntimeErrorsOptions,
  context: RuntimeContext = {}
): Promise<number> {
  const { durationMs, json } = options;
  const devServerUrl = await resolveDevServerUrlAsync(options, context);
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
export async function runtimeNetworkAsync(
  options: RuntimeNetworkOptions,
  context: RuntimeContext = {}
): Promise<number> {
  const { durationMs, json } = options;
  const devServerUrl = await resolveDevServerUrlAsync(options, context);
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
 * The runtime refused `Network.enable`.
 *
 * Reported as its own error, never as an empty window: "the app made no requests" and "this runtime
 * cannot report requests" are both plausible and lead to opposite next steps.
 *
 * The why and the how both branch on what the runtime actually answered
 * ({@link classifyNetworkDomainRefusal}), because React Native's two refusals have nothing in
 * common. This message used to quote "multiple React Native hosts are registered" and then blame a
 * runtime built without the domain and recommend an SDK upgrade — three sentences that contradicted
 * the evidence in the one above them.
 *
 * @ref llp/0005-runtime-loop-tools.rfc.md §Implemented in v1 as — Network inspection.
 */
function networkDomainUnavailableError(
  devServerUrl: string,
  cause: NetworkDomainUnavailableError,
  targets: CdpTarget[]
): CommandError {
  const refusal = classifyNetworkDomainRefusal(cause);
  const advertised = targets.some(targetAdvertisesNetworkPanel);
  const quoted = `it answered Network.enable with an error: "${cause.reason}"`;

  // Reading the errors is the answer to all three, because a failing request nearly always throws
  // or logs; only the way to get the network log itself back differs.
  const readErrorsInstead = `Read the app's runtime errors meanwhile — a request that fails almost always throws or logs there — or wrap the call in your own logging and read the value with "npx exagent runtime:eval".`;

  const { why, how } =
    refusal === 'multiple-hosts'
      ? {
          // Observed in React Native 0.86's HostAgent.cpp; see `classifyNetworkDomainRefusal`.
          why: `${quoted}. The domain attaches only while exactly one React Native host is registered in the app's process, and this app's process has more than one. The count is a property of the app, not of the dev server: stopping another dev server does not lower it, and neither does reconnecting the debugger. Expo Go reaches this state by holding a host for a project it loaded earlier alongside the one for this project.`,
          how: `Relaunch the app so this project's host is the only one registered — "npx exagent navigate /" after closing the app reloads it from scratch — then run this command again. A development build that runs one host answers the domain directly. ${readErrorsInstead}`,
        }
      : refusal === 'not-implemented'
        ? {
            why: `${quoted}. The runtime carries no handler for the method, so there is no request log in it to read. Network inspection is an unstable part of the React Native debugger and a runtime can be built without it; Expo Go for Android ships a JavaScript engine with no Chrome DevTools Protocol debugger at all, which answers every method this way.${advertised ? ' The dev server does offer the network panel for this app, which describes what the debugger frontend would show and is not a promise from the runtime.' : ''}`,
            how: `${readErrorsInstead} Opening the app on iOS, or in a development build, gives a runtime that implements the domain.`,
          }
        : {
            why: `${quoted}. That is not a refusal this CLI recognises: the two React Native sends are "the domain is unavailable when multiple hosts are registered" and "no such method". The answer above is the whole of what the runtime said.`,
            how: `${readErrorsInstead} Re-run with EXPO_DEBUG=1 to see the debugger traffic that produced this answer.`,
          };

  const error = new CommandError(
    'NETWORK_DOMAIN_UNAVAILABLE',
    [
      `The app connected to ${devServerUrl} did not report its network requests.`,
      `Why: ${why}`,
      `How: ${how}`,
    ].join('\n')
  );
  error.suggestedCommand = 'npx exagent runtime:errors';
  return error;
}
