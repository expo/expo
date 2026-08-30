// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0005
//
// @ref llp/0005-runtime-loop-tools.rfc.md
// The `@expo/agent-cli runtime:network` command, lifted out of `src/runtime/runtimeAsync.ts` when it
// left the v1 surface. It shared that module with `eval` and `errors`, so what moved is these
// two functions and the imports only they used.

import { event } from '../../events';
import { followUpsEnabled, reportFollowUps } from '../../followups';
import * as Log from '../../log';
import { PROGRAM_PREFIX } from '../../programName';
import type { CdpTarget } from '../../runtime/cdpClient';
// The family's one resolution step (`src/runtime/preflight.ts`): the dev server, the app and the
// platform index in one read. This command asked for all three separately when it shipped.
import { preflightRuntimeAsync, type RuntimeContext } from '../../runtime/preflight';
import { CommandError } from '../../utils/errors';
import { buildRuntimeNetworkFollowUps } from './followups';
import {
  countFailedRequests,
  countPendingRequests,
  formatNetworkRequests,
  networkRequestsToJson,
} from './format';
import {
  CdpNetworkCollector,
  classifyNetworkDomainRefusal,
  NetworkDomainUnavailableError,
  targetAdvertisesNetworkPanel,
  type NetworkRequestRecord,
} from './networkCollector';
import type { RuntimeNetworkOptions } from './resolveOptions';

/**
 * Listen for the HTTP requests the app makes over a window and print what it asked for and got.
 *
 * @ref llp/0017-deferred-commands.reference.md §runtime:network
 */
export async function runtimeNetworkAsync(
  options: RuntimeNetworkOptions,
  context: RuntimeContext = {}
): Promise<number> {
  const { durationMs, json } = options;
  const {
    devServerUrl,
    deviceIndex,
    appTargets: targets,
  } = await preflightRuntimeAsync(
    { need: 'debugger-target', devServerUrl: options.devServerUrl, platform: options.platform },
    context
  );

  let requests: NetworkRequestRecord[];
  const collector = new CdpNetworkCollector({
    metroUrl: devServerUrl,
    durationMs,
    platform: options.platform,
    deviceIndex,
  });
  try {
    requests = await collector.collectAsync();
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

  // @ref ./networkCollector — friction run 6, F61. `Network.enable` is acknowledged by a runtime
  // with no debugger behind it, so nothing was ever thrown here and the empty list read as "the app
  // made no requests". The classification now has a name for that, and it is printed.
  const silence = classifyNetworkDomainRefusal(null, {
    debuggerBlind: collector.capability?.blind,
  });

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
        {
          ...networkRequestsToJson(devServerUrl, durationMs, requests, {
            runtimeReadable:
              collector.capability?.blind == null ? null : !collector.capability.blind,
            runtimeEvidence: collector.capability?.evidence ?? null,
          }),
          followups,
        },
        null,
        2
      )
    );
  } else {
    Log.log(
      formatNetworkRequests(
        devServerUrl,
        durationMs,
        requests,
        silence === 'acknowledged-but-blind'
          ? `CAVEAT: this runtime accepted Network.enable and carries no debugger behind it, so an empty list means nothing about what the app requested. Why: ${collector.capability?.evidence ?? 'it answered no debugger call'}. Read the app's errors with "${PROGRAM_PREFIX} runtime:errors" — that command falls back to the dev server's own log — or open the app on iOS or in a development build.`
          : null
      )
    );
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
 * @ref llp/0017-deferred-commands.reference.md §runtime:network
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
  const readErrorsInstead = `Read the app's runtime errors meanwhile — a request that fails almost always throws or logs there — or wrap the call in your own logging and read the value with "${PROGRAM_PREFIX} runtime:eval".`;

  const { why, how } =
    refusal === 'multiple-hosts'
      ? {
          // Observed in React Native 0.86's HostAgent.cpp; see `classifyNetworkDomainRefusal`.
          why: `${quoted}. The domain attaches only while exactly one React Native host is registered in the app's process, and this app's process has more than one. The count is a property of the app, not of the dev server: stopping another dev server does not lower it, and neither does reconnecting the debugger. Expo Go reaches this state by holding a host for a project it loaded earlier alongside the one for this project.`,
          how: `Relaunch the app so this project's host is the only one registered — "${PROGRAM_PREFIX} navigate /" after closing the app reloads it from scratch — then run this command again. A development build that runs one host answers the domain directly. ${readErrorsInstead}`,
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
  error.suggestedCommand = `${PROGRAM_PREFIX} runtime:errors`;
  return error;
}
