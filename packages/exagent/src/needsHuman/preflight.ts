// @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol
// Layer 1: ask the cheap question before starting the expensive command.
//
// "Who is this machine signed in as" is the precondition behind most of the registry, and it costs
// one short subprocess to answer. Asking it first turns a failure that arrives after minutes of
// exporting into one that arrives before anything was spent — and it is the fact `exagent status`
// reports, so a driving agent can find out what will need its user before it starts.
//
// Nothing here ever throws. A preflight that cannot run is not an answer of "no": it is no answer,
// and the caller falls back to recognising the failure when it happens (layer 3).

import { resolveEasCliOrThrow } from '../utils/easCli';
import { spawnSubprocessAsync } from '../utils/subprocess';
import { looksLikeWrapperCrash } from '../utils/wrapperCrash';
import { lastNonEmptyLine } from './detect';

/** Who the Expo CLI family acts as on this machine. */
export interface AuthPreflight {
  /** Null when nothing could answer, which is not the same as "signed out". */
  loggedIn: boolean | null;
  /** The account name, when something knew it. */
  user: string | null;
  /** What answered. Null when nothing did. */
  source: 'eas whoami' | 'EXPO_TOKEN' | null;
}

/**
 * How long `eas whoami` may take.
 *
 * Status promises to be instant and this is one of its sections, so a CLI that is slow to start
 * costs an "unknown" line rather than the whole report's speed.
 */
export const AUTH_PREFLIGHT_TIMEOUT_MS = 4000;

/** One answer per project per process: the account does not change while a command runs. */
const cache = new Map<string, Promise<AuthPreflight>>();

/**
 * Who this machine is signed in to Expo as.
 *
 * `eas whoami` is asked first, because it is the one that also knows the *name*, and because it
 * already reads `EXPO_TOKEN` itself — so a token that works is reported as a working login rather
 * than as a variable that is merely set. The variable is only consulted when the CLI could not be
 * asked at all.
 *
 * Cached for the lifetime of the process, so a command that asks twice spawns once.
 */
export function readAuthPreflightAsync(
  projectRoot: string,
  { timeoutMs = AUTH_PREFLIGHT_TIMEOUT_MS }: { timeoutMs?: number } = {}
): Promise<AuthPreflight> {
  const cached = cache.get(projectRoot);
  if (cached) {
    return cached;
  }
  const answer = probeAsync(projectRoot, timeoutMs);
  cache.set(projectRoot, answer);
  return answer;
}

/** Forget what was answered, for tests and for a command that changed the login itself. */
export function resetAuthPreflightCache(): void {
  cache.clear();
}

async function probeAsync(projectRoot: string, timeoutMs: number): Promise<AuthPreflight> {
  let command: string;
  try {
    command = resolveEasCliOrThrow(projectRoot).command;
  } catch {
    // No EAS CLI on this machine: nothing can be asked, so only the variable is left.
    return fromTokenAlone();
  }

  const result = await spawnSubprocessAsync(command, ['whoami'], {
    cwd: projectRoot,
    output: 'capture',
    timeoutMs,
  });

  if (result.spawnError || result.timedOut) {
    return fromTokenAlone();
  }
  // A binary that is not the EAS CLI answers nothing about the account. It exits non-zero like a
  // signed-out CLI does, and reading that as "signed out" would hand the user a login they do not
  // need — and, worse, would stop a command that had every right to run. `null` is the honest
  // answer, and the caller falls back to recognising a real failure when it happens (layer 3).
  if (looksLikeWrapperCrash({ tool: 'eas', ...result })) {
    return fromTokenAlone();
  }
  if (result.exitCode !== 0) {
    // The CLI answered, and the answer was no — including a run with an `EXPO_TOKEN` that the
    // service rejected, which is exactly the case a bare "the variable is set" would get wrong.
    return { loggedIn: false, user: null, source: 'eas whoami' };
  }

  return { loggedIn: true, user: parseUser(result.stdout), source: 'eas whoami' };
}

/**
 * What `EXPO_TOKEN` alone says.
 *
 * Nothing was verified: no request was made and the token may be expired. It is reported because
 * a machine with the variable set is a machine that was *configured* to act as an account, which
 * is what an agent deciding whether to hand a login to its user needs to know.
 */
function fromTokenAlone(): AuthPreflight {
  return process.env.EXPO_TOKEN
    ? { loggedIn: true, user: null, source: 'EXPO_TOKEN' }
    : { loggedIn: null, user: null, source: null };
}

/**
 * The account name out of `eas whoami`.
 *
 * The last line with anything on it, because the CLI may print a notice above its answer, and
 * anything that does not look like one name is not one.
 */
function parseUser(stdout: string): string | null {
  const line = lastNonEmptyLine(stdout)?.trim();
  return line && /^[\w.@+-]+$/.test(line) ? line : null;
}
