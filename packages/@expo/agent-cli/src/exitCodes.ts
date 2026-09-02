// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// The exit codes of every `@expo/agent-cli` command, in one place.
//
// A driving agent reads the exit code before it reads a word of the output, so the code has to
// answer one question the output cannot answer cheaply: did the tool work, and did the thing the
// tool was asked about work? Those are two questions, and conflating them is what makes a CLI
// unreadable to an agent — a command that ran a test suite and reported a failing test has done
// its job perfectly, while a command that could not find the project has not, and `1` for both
// leaves the agent scraping stdout to tell them apart.
//
// Three bands, and one rule each:
//
// - `0` — the tool worked and the outcome was success.
// - `1` — the tool did not work: a usage error, a missing dependency, a crash. Retrying the same
//   command unchanged is pointless.
// - `7` — the tool worked and stopped at a step only a person can complete (signing in, clicking
//   a link, approving a purchase). Distinct from `1` because the recovery is not another command.
// - `20`–`29` — the tool worked and the outcome was not success. Retrying is meaningful; the
//   payload says what went wrong with the *subject*, not with the CLI.
//
// Nothing outside this file spells an exit code as a literal, and nothing leaves the process with
// one except through `exitWithCodeAsync` or a `CommandError` carrying an `exitCode`.

import { flushEventLogger } from '2g';

/** The tool worked and the outcome was success. */
export const EXIT_OK = 0;

/**
 * The tool did not work.
 *
 * A usage error (unknown command, bad flag, unusable value), a missing dependency, or an
 * unexpected failure. Every `CommandError` exits with this unless it names another code.
 */
export const EXIT_ERROR = 1;

/**
 * The tool worked and a person must complete the next step.
 *
 * The step is outside the CLI — signing in through a browser, approving a device, finishing a
 * launch in a web page — so an agent's recovery is to hand the printed URL or instruction to the
 * human it is working for, not to run another command.
 *
 * The error class that carries this code arrives with the commands that need it; the constant is
 * defined here so the number is reserved and documented once.
 */
export const EXIT_NEEDS_HUMAN = 7;

/**
 * The tool worked and the operation it performed failed.
 *
 * The build did not build, the smoke test crashed the app, the check did not pass. The command
 * itself is healthy, and its `--json` payload describes the failure.
 */
export const EXIT_OUTCOME_FAILED = 20;

/**
 * The tool worked and the operation was canceled.
 *
 * Canceled by the caller (a declined prompt, `SIGINT`) or by the service that was running it, so
 * nothing is known about whether it would have succeeded.
 *
 * **Reserved, and emitted by no v1 command** [observed — 2026-08-26]. The one command whose
 * outcomes reached it was `build:wait`, which is deferred (`src/deferred/build-wait/`,
 * llp/0016 §Deferred is a place); and a declined plan exits `0` by explicit decision, because
 * nothing ran and so nothing failed (llp/0008 §Plan-with-cost dry run). The constant stays so the
 * number keeps its meaning for the command that brings it back — but an agent told to branch on
 * `21` is branching on a code this release never produces. `src/__tests__/exitCodes-test.ts` is
 * what keeps that sentence true.
 */
export const EXIT_OUTCOME_CANCELED = 21;

/**
 * The tool worked and the operation did not finish in the time it was given.
 *
 * Inconclusive rather than failed: the wait expired, and a longer `--timeout` or a second look may
 * still find success. Kept apart from {@link EXIT_OUTCOME_FAILED} because retrying is the obvious
 * next action here and is a waste of minutes there.
 */
export const EXIT_OUTCOME_TIMEOUT = 22;

/**
 * Leave the process with one of the codes above, without losing the events of the run.
 *
 * `process.exit` drops whatever the event logger has buffered, so an agent reading `LOG_EVENTS`
 * would lose the very events that explain the code it just read. It also aborts Node on Windows
 * when an Undici socket is still closing. Set `process.exitCode`, flush, and let the event loop
 * finish naturally instead. The returned promise never settles, so the caller has nothing further
 * to run, the same way `logCmdError` ends a failing command; a pending promise alone does not keep
 * the event loop alive.
 *
 * A command reporting a *tool* error throws a `CommandError` instead — with an `exitCode` when it
 * is not {@link EXIT_ERROR} — so the error is printed and put on the event stream first.
 */
export function exitWithCodeAsync(code: number): Promise<never> {
  process.exitCode = code;
  flushEventLogger()
    .catch(() => {})
    .finally(() => {
      // A fetch keep-alive socket would keep the process around after the report is complete.
      // Close sockets, then let Node leave naturally with process.exitCode. Calling process.exit
      // while Undici is closing one of these aborts with STATUS_STACK_BUFFER_OVERRUN on Windows.
      destroyActiveSockets();
    });
  return new Promise<never>(() => {});
}

function destroyActiveSockets(): void {
  try {
    require('http').globalAgent.destroy();
    require('https').globalAgent.destroy();
  } catch {
    // Agents already gone.
  }

  const handles = (
    process as NodeJS.Process & {
      _getActiveHandles?: () => {
        constructor?: { name?: string };
        destroy?: () => void;
        fd?: number;
      }[];
    }
  )._getActiveHandles?.();
  if (!Array.isArray(handles)) {
    return;
  }
  for (const handle of handles) {
    const name = handle.constructor?.name ?? '';
    if (name !== 'Socket' && name !== 'TLSSocket') {
      continue;
    }
    const fd = handle.fd;
    if (fd === 0 || fd === 1 || fd === 2) {
      continue;
    }
    try {
      handle.destroy?.();
    } catch {
      // Already closed.
    }
  }
}
