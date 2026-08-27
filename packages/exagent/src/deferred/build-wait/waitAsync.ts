// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
// @ref llp/0010-agent-conventions.rfc.md §Exit codes
// The wait loop. `eas build --wait` already exists and only helps the process that started the
// build; this attaches to one that already exists — started by CI, by the dashboard, or by another
// agent — and turns it into an exit code a shell can branch on.
//
// Everything the loop decides is somewhere else: `status.ts` says whether a status ends the wait,
// `parseView.ts` reads the payload, `resolveOptions.ts` says how long and how often. What is left
// here is the sequencing, and the three things that go wrong with sequencing — a poll that fails,
// a wait that expires, and a person pressing Ctrl-C.

import { outputTail } from '../../deploy/parseOutput';
import { event } from '../../events';
import { easCliArgs, easCliLabel, type EasCli } from '../../utils/easCli';
import { CommandError } from '../../utils/errors';
import { spawnSubprocessAsync, type SubprocessResult } from '../../utils/subprocess';
import {
  checkBinaryCommand,
  looksLikeWrapperCrash,
  runnerCrashDetail,
} from '../../utils/wrapperCrash';
import { parseLastJsonObject, readProgress, readString } from './parseView';
import type { BuildWaitOptions } from './resolveOptions';
import { resolveTerminalStatus, type BuildWaitOutcome } from './status';
import type { BuildViewPayload } from './types';

/**
 * How many polls in a row may fail before the wait gives up.
 *
 * A wait is a long-lived thing pointed at a network service: a blip, a 5xx, or a token refresh
 * will happen inside forty-five minutes, and ending the wait on the first one would make the
 * command useless for exactly the builds it exists for. Three is enough to ride out a blip and few
 * enough that a mistyped id is answered in seconds rather than minutes.
 */
export const MAX_CONSECUTIVE_FAILURES = 3;

/** How much of a failing poll's output travels in the error message. */
const OUTPUT_TAIL_LINES = 10;

/** What one wait ended as, before it is turned into a report. */
export interface BuildWaitResult {
  outcome: BuildWaitOutcome;
  /** The last status observed, as EAS spelled it. */
  status: string | null;
  /** The last payload that parsed, which is what the report is read from. */
  payload: BuildViewPayload | null;
  waitedMs: number;
  polls: number;
  /** Whether the wait ended because a terminal signal arrived rather than a status. */
  interrupted: boolean;
}

/** The `eas` command that answers for one kind of wait. */
export function viewCommand(options: Pick<BuildWaitOptions, 'kind'>): string {
  return options.kind === 'submission' ? 'submit:view' : 'build:view';
}

/**
 * The interval one poll waits after, which is the default interval until the build is plainly a
 * long one. See {@link BuildWaitOptions.backoffAfterMs} for why it moves.
 */
export function intervalAt(elapsedMs: number, options: BuildWaitOptions): number {
  return elapsedMs >= options.backoffAfterMs ? options.maxIntervalMs : options.intervalMs;
}

/**
 * Poll the build until it reaches a terminal status, the timeout expires, or a signal arrives.
 *
 * Never rejects for anything the build did — an errored build is a *result*, and reporting it as
 * an exception would collapse it back into the exit code the command exists to separate it from.
 * It throws only when the tool could not do its job.
 *
 * @throws {CommandError} `BUILD_VIEW_FAILED` after {@link MAX_CONSECUTIVE_FAILURES} polls in a row
 *   that did not answer.
 */
export async function pollBuildAsync(
  easCli: EasCli,
  projectRoot: string,
  options: BuildWaitOptions
): Promise<BuildWaitResult> {
  const command = viewCommand(options);
  const args = [command, options.id, '--json'];
  const startedAt = Date.now();
  const interrupt = watchForInterrupt();

  let polls = 0;
  let consecutiveFailures = 0;
  let payload: BuildViewPayload | null = null;
  let status: string | null = null;

  const ended = (outcome: BuildWaitOutcome): BuildWaitResult => ({
    outcome,
    status,
    payload,
    waitedMs: Date.now() - startedAt,
    polls,
    interrupted: interrupt.interrupted(),
  });

  try {
    for (;;) {
      polls++;
      const result = await spawnSubprocessAsync(easCli.command, easCliArgs(easCli, args), {
        cwd: projectRoot,
        output: 'capture',
      });
      const elapsedMs = Date.now() - startedAt;

      // A Ctrl-C reaches the child too (`spawnSubprocessAsync` forwards terminal signals), so the
      // poll it interrupted comes back empty. That is a stop, not a failed poll.
      if (interrupt.interrupted()) {
        return ended('canceled');
      }

      const polled = result.exitCode === 0 ? parseLastJsonObject(result.stdout) : null;
      if (polled == null) {
        consecutiveFailures++;
        event('build_wait_poll_failed', {
          kind: options.kind,
          id: options.id,
          poll: polls,
          consecutiveFailures,
          exitCode: result.exitCode,
          message: failureMessage(result),
        });
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          throw pollFailedError(options, result, easCli);
        }
      } else {
        consecutiveFailures = 0;
        payload = polled;
        status = readString(polled, 'status');
        event('build_wait_poll', {
          kind: options.kind,
          id: options.id,
          poll: polls,
          ...readProgress(polled, elapsedMs),
        });

        const terminal = resolveTerminalStatus(status);
        if (terminal) {
          return ended(terminal.outcome);
        }
      }

      // The deadline is checked after the poll, so the last poll happens *at* the timeout rather
      // than one interval before it: the answer may have arrived while this wait was sleeping.
      const remainingMs = options.timeoutMs - (Date.now() - startedAt);
      if (remainingMs <= 0) {
        return ended('timeout');
      }

      await sleepAsync(Math.min(intervalAt(elapsedMs, options), remainingMs), interrupt.arrived);
      if (interrupt.interrupted()) {
        return ended('canceled');
      }
    }
  } finally {
    interrupt.stop();
  }
}

/**
 * A terminal signal, for the length of one wait.
 *
 * `spawnSubprocessAsync` forwards signals to the child it is running, which stops the poll that is
 * in flight — but a wait spends almost all of its time asleep between polls, and without this a
 * Ctrl-C during the sleep is noticed up to thirty seconds later. An agent that killed a wait and
 * watched it keep running would kill it harder next time.
 */
function watchForInterrupt(): {
  /** Resolves when the first terminal signal arrives, and never rejects. */
  arrived: Promise<void>;
  interrupted: () => boolean;
  /** Take the handlers off again, so a long-lived process is not left listening. */
  stop: () => void;
} {
  let seen = false;
  let resolveArrived: () => void;
  const arrived = new Promise<void>((resolve) => {
    resolveArrived = resolve;
  });

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  const handle = () => {
    seen = true;
    resolveArrived();
  };
  for (const signal of signals) {
    process.on(signal, handle);
  }

  return {
    arrived,
    interrupted: () => seen,
    stop: () => {
      for (const signal of signals) {
        process.off(signal, handle);
      }
    },
  };
}

/** Wait out one poll interval, or stop early when a terminal signal arrives. */
async function sleepAsync(milliseconds: number, interrupted: Promise<void>): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      interrupted,
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

/** One line saying what a failing poll did, for the event stream. */
function failureMessage(result: SubprocessResult): string {
  if (result.spawnError) {
    return `eas could not be run: ${result.spawnError.code ?? result.spawnError.message}`;
  }
  if (result.exitCode !== 0) {
    return `eas exited with code ${result.exitCode}`;
  }
  return 'eas exited 0 but printed no JSON object';
}

/**
 * The error for a wait whose polls stopped answering.
 *
 * A build id and a workflow id look alike and come from the same places, and `eas build:view` is
 * the command that rejects the wrong one — so the prose names the command that waits on the other
 * kind (llp/0006 §Errors are prompts). `eas workflow:status --wait` already exists, which is why
 * this is one line of prose and not a second poll loop.
 *
 * The `Try:` line is **not** that command, though the `How:` line offers it. `How:` is conditional
 * — "*if* it names a workflow run" — and the last line of a failure is what a driving agent acts
 * on, so putting the workflow command there strips the condition and sends the agent to run a
 * command that fails again for the same reason [observed — friction run, 2026-08-23]. The check
 * that is unconditionally worth running is who this CLI is acting as, against the binary that
 * actually ran.
 */
function pollFailedError(
  options: BuildWaitOptions,
  result: SubprocessResult,
  easCli: EasCli
): CommandError {
  const command = viewCommand(options);
  // The runner rung is already written the way a reader would type it; a resolved binary is a path,
  // which is what needs the quoting (`easCliLabel`).
  const whoami =
    easCli.source === 'runner'
      ? `${easCliLabel(easCli)} whoami`
      : checkBinaryCommand(easCli.command, ['whoami']);
  const crashed = looksLikeWrapperCrash({ tool: 'eas', ...result });
  const detail = crashed
    ? runnerCrashDetail({ tool: 'eas', exitCode: result.exitCode }, easCliLabel(easCli))
    : fencedTail(result);
  const cause = crashed
    ? `Why: the "eas" that ran is not answering as the EAS CLI at all, so nothing was learned about the ${options.kind === 'submission' ? 'submission' : 'build'}.`
    : options.kind === 'submission'
      ? `Why: either the id is not a submission this account can see — a mistyped id, or a different account — or the EAS API could not be reached from here.`
      : `Why: either the id is not a build this account can see — a mistyped id, a different account, or a *workflow* id rather than a build id — or the EAS API could not be reached from here.`;
  const how =
    options.kind === 'submission'
      ? `How: check the id, and check who that CLI is acting as with "${whoami}". On a headless machine, set EXPO_TOKEN to an access token from expo.dev.`
      : `How: check the id. If it names a workflow run rather than a build, "npx eas workflow:status ${options.id} --wait --json" waits on it instead. If the account is the problem, "${whoami}" says who the CLI is acting as.`;

  const error = new CommandError(
    'BUILD_VIEW_FAILED',
    [
      `Gave up waiting: "eas ${command} ${options.id} --json" failed ${MAX_CONSECUTIVE_FAILURES} times in a row.`,
      cause,
      how,
      detail,
    ]
      .filter(Boolean)
      .join('\n')
  );
  error.suggestedCommand = whoami;
  return error;
}

/** The last lines the failing polls printed, under the heading that says what they are. */
function fencedTail(result: SubprocessResult): string {
  const tail = outputTail(`${result.stdout}${result.stderr}`, OUTPUT_TAIL_LINES);
  return tail ? `\nWhat the tool printed:\n${tail}` : '';
}
