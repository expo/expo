// @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol
// @ref llp/0004-smart-start-and-project-state.rfc.md §Plan contract
// A busy port is not a step only a person can complete.
//
// The Expo CLI asks `Use port 8181 instead?` when the port it wanted is taken, and a run with no
// terminal cannot answer, so the whole start stops there. That reached this CLI as the generic
// `expo-prompt` scenario: exit 7, "a person must answer this", and a `How:` line naming the very
// flag the caller had just passed [observed — friction run 4, 2026-08-23].
//
// Every part of that is wrong for *this* prompt, and only for this one. Picking a free port is
// mechanical: no account, no permission, no click. So this file recognises the port question
// specifically, before the needs-human classifier sees the failure, and the caller either retries
// on a port it picked itself or — when the caller *named* the port — reports the outcome that a
// demanded port was taken. `expo-prompt` still covers every other question the Expo CLI asks.

import net from 'net';

/** What the Expo CLI said when a port was taken. */
export interface PortCollision {
  /** The port that was asked for and could not be had. */
  requestedPort: number | null;
  /** The port the CLI offered instead, when its question named one. */
  offeredPort: number | null;
}

/**
 * The lines the Expo CLI prints when the port it wanted is busy.
 *
 * Three spellings, because they come from two versions and two branches of one function
 * [observed — `packages/@expo/cli/src/utils/port.ts`, and live against expo 57.0.15 on 2026-08-23]:
 *
 * - `Use port 8181 instead?` — the question itself, quoted back by the prompt helper's
 *   non-interactive failure under `Required input:`. This is the one that reached the friction run.
 * - `Port 8180 is running node in another window` / `is being used by another process` — the line
 *   printed just above the question, which survives even when the question does not.
 * - `Port 8180 is unavailable and 'npx expo' is running in non-interactive mode` — the newer
 *   branch, which throws instead of asking when the port was explicit.
 */
const COLLISION_PATTERNS: RegExp[] = [
  /Use port (?<offered>\d+) instead\?/i,
  /Port\s+(?<requested>\d+)\s+is\s+(?:running\b|being used\b)/i,
  /Port\s+(?<requested>\d+)\s+is unavailable and/i,
];

/**
 * Whether a failed `expo` step stopped because its port was taken, and which ports it named.
 *
 * Pure over the captured text, so every spelling above is testable without a busy port.
 *
 * @param output everything the step printed, stderr and stdout together.
 */
export function detectPortCollision(output: string): PortCollision | null {
  let requestedPort: number | null = null;
  let offeredPort: number | null = null;
  let matched = false;

  for (const pattern of COLLISION_PATTERNS) {
    const match = pattern.exec(output);
    if (!match) {
      continue;
    }
    matched = true;
    requestedPort ??= toPort(match.groups?.requested);
    offeredPort ??= toPort(match.groups?.offered);
  }

  return matched ? { requestedPort, offeredPort } : null;
}

function toPort(value: string | undefined): number | null {
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535 ? port : null;
}

/**
 * A dev server that was started somewhere other than where it was asked for.
 *
 * `from` is null when the Expo CLI's own message did not name the port it wanted — it does not
 * always — and inventing one would be this CLI claiming a fact nobody told it.
 */
export interface PortMove {
  /** The busy port, when the Expo CLI named it. */
  from: number | null;
  /** The port this CLI picked and the dev server took. */
  to: number;
}

/**
 * The sentence `@expo/agent-cli dev` prints when it moved the dev server off a busy port.
 *
 * Built here rather than written inline because it is read back by another *process* of this CLI:
 * a `--detach` run does the retry in the child, whose output goes to a log file, and the parent
 * has no other way to learn that the port it reports is not the port that was asked for
 * [friction run 5, F48-4]. {@link parsePortMove} is the other end, and a round-trip test pins the
 * pair — the parent's report goes silently wrong the moment the two drift.
 *
 * Why not compare the port the run asked for against the port the lock reports: a dev server can
 * land elsewhere for reasons that are not a collision, and reporting those as a move would be this
 * command inventing a busy port it never observed.
 */
export function formatPortMove(move: PortMove): string {
  return move.from == null
    ? `The port the dev server wanted was busy; started on ${move.to} instead.`
    : `Port ${move.from} was busy; started on ${move.to} instead.`;
}

/** `to` in the sentence above, which is the half that is always there. */
const PORT_MOVE_TO = /started on (\d+) instead/;

/** `from`, when the sentence had one. */
const PORT_MOVE_FROM = /Port (\d+) was busy/;

/**
 * Read {@link formatPortMove}'s sentence back out of a detached dev server's log.
 *
 * @param output everything the detached run printed, escape codes already stripped.
 * @returns the move, or null when the log holds none.
 */
export function parsePortMove(output: string): PortMove | null {
  const to = toPort(PORT_MOVE_TO.exec(output)?.[1]);
  if (to == null) {
    return null;
  }
  return { from: toPort(PORT_MOVE_FROM.exec(output)?.[1]), to };
}

/** How far past the busy port to look before giving up on finding a free one. */
const FREE_PORT_SCAN_RANGE = 200;

/**
 * A port on this machine that nothing is listening on, at or after `from`.
 *
 * Bound and released rather than probed with a connection: a port that refuses a connection can
 * still be unbindable (a listener on another interface, a socket in `TIME_WAIT`), and the question
 * this answers is whether the dev server will be able to *take* it.
 *
 * @returns the port, or null when the whole range was busy.
 */
export async function findFreePortAsync(
  from: number,
  { range = FREE_PORT_SCAN_RANGE }: { range?: number } = {}
): Promise<number | null> {
  for (let port = from; port < from + range && port <= 65535; port++) {
    if (await isPortBindableAsync(port)) {
      return port;
    }
  }
  return null;
}

/** Whether a server can bind this port on the loopback interface right now. */
export async function isPortBindableAsync(port: number): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(true));
    });
  });
}
