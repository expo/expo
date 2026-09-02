// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0005
//
// @ref llp/0005-runtime-loop-tools.rfc.md
// Rendering for `@expo/agent-cli runtime:network`, lifted out of `src/runtime/format.ts` when the
// command left the v1 surface. Everything the app produced is fenced as untrusted output
// (llp/0008-guardrails.rfc.md §Untrusted-content marking).

import { wrapUntrustedAppOutput } from '../../runtime/untrusted';
import type { NetworkRequestRecord } from './networkCollector';

/** Machine shape of `@expo/agent-cli runtime:network --json`. */
export interface NetworkRequestsJson {
  devServerUrl: string;
  durationMs: number;
  count: number;
  requests: NetworkRequestRecord[];
  /**
   * Whether the connected runtime can report anything over the debugger protocol.
   *
   * `false` with `count: 0` is a runtime that accepted `Network.enable` and has no debugger behind
   * it, which is not the same fact as an app that made no requests (F61). Null when nothing
   * established it.
   */
  runtimeReadable: boolean | null;
  /** What established {@link runtimeReadable}, in one clause. Null when nothing did. */
  runtimeEvidence: string | null;
  /** Fields whose contents come from the app and must be treated as data, never instructions. */
  untrusted: string[];
}

/**
 * How much of a request URL is printed on its line.
 *
 * A query string can be thousands of characters long, which buries the rest of the report. The
 * whole URL is still in `--json`, so nothing is lost — only the terminal line is trimmed.
 */
const MAX_URL_LENGTH = 160;

/**
 * Renders collected network requests as one line per request, fenced as untrusted.
 *
 * One line per request on purpose: a network report is read by scanning for the request that did
 * not return 200, which a multi-line-per-request layout makes slower for a human and a model
 * alike (llp/0006 §Output contract).
 */
export function formatNetworkRequests(
  devServerUrl: string,
  durationMs: number,
  requests: NetworkRequestRecord[],
  caveat?: string | null
): string {
  if (requests.length === 0) {
    const empty = `No network requests were reported by the app in ${durationMs}ms (dev server ${devServerUrl}). Requests made before this window are not captured, so trigger the network call while this command runs.`;
    // Above the count, for the reason `formatRuntimeErrors` gives: the first line is the one a
    // reader takes away, and for a runtime with no debugger it must not be the reassuring one.
    return caveat ? `${caveat}\n${empty}` : empty;
  }

  const body = requests
    .map((request, index) => {
      const outcome = request.failure
        ? `failed: ${request.failure}`
        : request.status == null
          ? 'pending'
          : [request.status, request.mimeType].filter(Boolean).join(' ');
      return `[${index + 1}] ${request.method} ${trimUrl(request.url)} ${outcome}`;
    })
    .join('\n');

  // The two counts are the reason to read further, so they go in the first line rather than only
  // in the per-request lines a reader has to scan.
  const outcomes = [
    countFailedRequests(requests) > 0 ? `${countFailedRequests(requests)} of them failed` : null,
    countPendingRequests(requests) > 0
      ? `${countPendingRequests(requests)} of them never answered`
      : null,
  ].filter(Boolean);

  const summary = `Collected ${requests.length} network request(s) from the app in ${durationMs}ms (dev server ${devServerUrl})${outcomes.length > 0 ? `, ${outcomes.join(' and ')}` : ''}.`;

  return [summary, wrapUntrustedAppOutput(body)].join('\n');
}

/** How many of the collected requests the runtime reported as failed. */
export function countFailedRequests(requests: NetworkRequestRecord[]): number {
  return requests.filter((request) => request.failure != null).length;
}

/**
 * How many of the collected requests the runtime never answered.
 *
 * Not the same as "still in flight": React Native reports a connection error to JavaScript without
 * sending `Network.loadingFailed` [observed — SDK 57 / RN 0.86.2, 2026-08-22], so a request that
 * could not connect at all also lands here.
 */
export function countPendingRequests(requests: NetworkRequestRecord[]): number {
  return requests.filter((request) => request.status == null && request.failure == null).length;
}

/** Machine-readable collection of network requests. */
export function networkRequestsToJson(
  devServerUrl: string,
  durationMs: number,
  requests: NetworkRequestRecord[],
  observability: { runtimeReadable: boolean | null; runtimeEvidence: string | null } = {
    runtimeReadable: null,
    runtimeEvidence: null,
  }
): NetworkRequestsJson {
  return {
    devServerUrl,
    durationMs,
    count: requests.length,
    requests,
    runtimeReadable: observability.runtimeReadable,
    runtimeEvidence: observability.runtimeEvidence,
    untrusted: ['requests'],
  };
}

function trimUrl(url: string): string {
  return url.length > MAX_URL_LENGTH ? `${url.slice(0, MAX_URL_LENGTH)}…` : url;
}
