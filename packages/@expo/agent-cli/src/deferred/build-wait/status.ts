// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
// @ref llp/0017-deferred-commands.reference.md §build:wait — The exit-code mapping. The band it maps into is llp/0010 §Exit codes.
// The whole of what `build:wait` decides: is this status the end of the wait, and if it is, what
// did the build do. Pure, and deliberately the only place either question is answered — a poll
// loop that inlined the comparison would be a loop nobody can test the interesting cases of.

import {
  EXIT_OK,
  EXIT_OUTCOME_CANCELED,
  EXIT_OUTCOME_FAILED,
  EXIT_OUTCOME_TIMEOUT,
} from '../../exitCodes';

/** What one wait ended as. Everything but `timeout` comes from the build's own status. */
export type BuildWaitOutcome = 'finished' | 'errored' | 'canceled' | 'timeout';

/** A status that ends the wait, and the outcome it is. */
export interface TerminalStatus {
  outcome: Exclude<BuildWaitOutcome, 'timeout'>;
  /** The code the process leaves with, from `exitCodes.ts`. */
  exitCode: number;
}

/**
 * The code the process leaves with, per outcome.
 *
 * This is the command: an agent running `@expo/agent-cli build:wait $ID` branches on the code before it
 * reads a byte of the payload, and the four outcomes are four branches it can take.
 */
const OUTCOME_EXIT_CODES: Record<BuildWaitOutcome, number> = {
  finished: EXIT_OK,
  errored: EXIT_OUTCOME_FAILED,
  canceled: EXIT_OUTCOME_CANCELED,
  timeout: EXIT_OUTCOME_TIMEOUT,
};

/** The code the process leaves with for one outcome. */
export function exitCodeForOutcome(outcome: BuildWaitOutcome): number {
  return OUTCOME_EXIT_CODES[outcome];
}

/** One terminal status entry, so the table below names an outcome and nothing else. */
function ends(outcome: Exclude<BuildWaitOutcome, 'timeout'>): TerminalStatus {
  return { outcome, exitCode: OUTCOME_EXIT_CODES[outcome] };
}

/**
 * The statuses that end a wait.
 *
 * Keyed by the normalized spelling, so one entry covers every casing and separator the two CLIs
 * use. `CANCELLED` is here as well as `CANCELED` because the GraphQL enum spells it with one `l`
 * and a good deal of surrounding prose spells it with two; guessing wrong would hang a wait.
 */
const TERMINAL_STATUSES: Record<string, TerminalStatus> = {
  FINISHED: ends('finished'),
  ERRORED: ends('errored'),
  CANCELED: ends('canceled'),
  CANCELLED: ends('canceled'),
};

/**
 * One spelling of a status, or null when the value is not one.
 *
 * Upper case, and hyphens read as underscores: `eas build:list --status` takes `in-queue` on the
 * way in and the GraphQL enum is `IN_QUEUE` on the way out [observed — eas-cli README], and
 * neither spelling is something this CLI controls. Reading both is cheaper than being wrong.
 */
export function normalizeStatus(status: unknown): string | null {
  if (typeof status !== 'string') {
    return null;
  }
  const normalized = status.trim().toUpperCase().replace(/-/g, '_');
  return normalized || null;
}

/**
 * Whether a status ends the wait, and what it ended as.
 *
 * **An unrecognized status is not terminal.** Polling on is the safe failure: a status this table
 * has not heard of is a new state of a service that ships without this CLI, and treating it as an
 * ending would report an outcome nobody observed. The timeout is what stops a wait that is wrong
 * about this, and it exits `22` — inconclusive — rather than claiming a result.
 *
 * `PENDING_CANCEL` is the case that makes the rule concrete: it is a cancellation that has been
 * asked for and not yet happened, so the build is still running and still resolves to something.
 *
 * @returns the outcome and its exit code, or null to keep polling.
 */
export function resolveTerminalStatus(status: unknown): TerminalStatus | null {
  const normalized = normalizeStatus(status);
  return normalized ? (TERMINAL_STATUSES[normalized] ?? null) : null;
}
