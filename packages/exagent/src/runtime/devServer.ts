// @ref llp/0005-runtime-loop-tools.rfc.md
// Reachability check for the dev server the runtime commands talk to.
//
// Every runtime command needs two things a project cannot promise: a dev server, and an app
// connected to it. Both are checked before a CDP connection is attempted, so the failure the
// user reads names the missing piece instead of the socket error it caused.

import { CommandError } from '../utils/errors';
import type { CdpTarget } from './cdpClient';

/** Where `npx expo start` listens by default. */
export const DEFAULT_DEV_SERVER_URL = 'http://127.0.0.1:8081';

/** Strip trailing slashes, so `${url}/json/list` is always a well formed path. */
export function normalizeDevServerUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Validate a `--dev-server-url` value, or fall back to the default dev server.
 *
 * Shared by every command that takes the flag, so one bad URL reads the same everywhere.
 *
 * @throws {CommandError} `BAD_ARGS` when the value is not an http(s) URL.
 */
export function resolveDevServerUrlFlag(value: unknown): string {
  if (value == null) {
    return DEFAULT_DEV_SERVER_URL;
  }
  const url = normalizeDevServerUrl(String(value));
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new CommandError(
      'BAD_ARGS',
      `--dev-server-url is not a URL: ${value}. Pass the dev server origin, for example --dev-server-url http://127.0.0.1:8081`
    );
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new CommandError(
      'BAD_ARGS',
      `--dev-server-url must be an http or https URL, but got ${value}. The dev server is reached over HTTP, for example --dev-server-url http://127.0.0.1:8081`
    );
  }
  return url;
}

export interface DevServerProbe {
  /** The dev server answered the debugger target list. */
  reachable: boolean;
  /** Debugger targets the dev server reported. Empty when it is unreachable. */
  targets: CdpTarget[];
  /** Why the dev server could not be reached, for the error message. */
  reason?: string;
}

/**
 * Ask the dev server for its debugger targets.
 *
 * Never throws: an unreachable dev server is an answer, so callers that can work without one
 * (deep-link navigation to a development build) are not forced into a failure path.
 */
export async function probeDevServerAsync(devServerUrl: string): Promise<DevServerProbe> {
  const url = `${normalizeDevServerUrl(devServerUrl)}/json/list`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error: unknown) {
    return {
      reachable: false,
      targets: [],
      reason: error instanceof Error ? error.message : String(error),
    };
  }

  if (!response.ok) {
    return {
      reachable: false,
      targets: [],
      reason: `${url} answered ${response.status} ${response.statusText}`,
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error: unknown) {
    return {
      reachable: false,
      targets: [],
      reason: `${url} did not answer with JSON: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  if (!Array.isArray(payload)) {
    return { reachable: false, targets: [], reason: `${url} did not answer with an array` };
  }

  return { reachable: true, targets: payload as CdpTarget[] };
}

/**
 * Resolve the debugger targets of a dev server that has an app connected to it.
 *
 * @throws {CommandError} `NO_DEV_SERVER` when nothing answers, `NO_APP_CONNECTED` when the dev
 * server runs but reports no debugger target.
 */
export async function requireConnectedAppAsync(devServerUrl: string): Promise<CdpTarget[]> {
  const url = normalizeDevServerUrl(devServerUrl);
  const probe = await probeDevServerAsync(url);

  if (!probe.reachable) {
    const error = new CommandError(
      'NO_DEV_SERVER',
      [
        `No Expo dev server answered at ${url}, so there is no app runtime to talk to.`,
        `Why: the request for the debugger target list failed (${probe.reason}).`,
        `How: run "npx expo start" in the project root and open the app on a device or simulator, then run this command again. Pass --dev-server-url to reach a dev server on another host or port.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npx exagent dev';
    throw error;
  }

  if (probe.targets.length === 0) {
    const error = new CommandError(
      'NO_APP_CONNECTED',
      [
        `The Expo dev server at ${url} is running, but no app is connected to it.`,
        `Why: its debugger target list (${url}/json/list) is empty, so there is no JavaScript runtime to talk to.`,
        `How: open the app on a device or simulator (press "i" or "a" in the "npx expo start" terminal), wait for the bundle to finish loading, then run this command again.`,
      ].join('\n')
    );
    error.suggestedCommand = 'npx exagent navigate /';
    throw error;
  }

  return probe.targets;
}
