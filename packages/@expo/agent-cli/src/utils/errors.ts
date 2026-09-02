import { AssertionError } from 'assert';
import chalk from 'chalk';
import { execSync } from 'child_process';

import { event as cliEvent } from '../events';
import { EXIT_ERROR, EXIT_NEEDS_HUMAN, exitWithCodeAsync } from '../exitCodes';
import { error as printToStderr, exit, exception, hasWrittenToStdout, log, warn } from '../log';
import { renderForInvoker } from './invoker';
import { isJsonRequested } from './jsonMode';

const ERROR_PREFIX = 'Error: ';

/** Width of the label column of the needs-human block, as in every other labelled output. */
const NEEDS_HUMAN_LABEL_WIDTH = 16;

/**
 * General error, formatted as a message in red text when caught by expo-cli (no stack trace is printed). Should be used in favor of `log.error()` in most cases.
 */
export class CommandError extends Error {
  name = 'CommandError';
  readonly isCommandError = true;
  [prop: string]: unknown;

  /**
   * Machine-readable next action for a driving agent (llp/0006 "errors are prompts"):
   * the exact command that most likely resolves this error. Printed as a trailing
   * `Try: <command>` line and carried on the `cli:error` JSONL event.
   */
  suggestedCommand?: string;

  /**
   * The facts this failure observed, for a caller that reads the envelope instead of the prose.
   *
   * @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope
   *
   * Structured JSON, always a flat object with a fixed key set *per error code* — the runtime
   * family's refusals carry the two list counts and the dev server they were read from
   * (`src/runtime/preflight.ts`). Undefined on every failure that has nothing to count, which is
   * most of them, and printed as `null` there: a caller reading `error.data` branches on a value
   * rather than on a missing key.
   */
  data?: Record<string, unknown>;

  /**
   * The code to leave the process with, when it is not {@link EXIT_ERROR} (llp/0010).
   *
   * Set it from `exitCodes.ts` — never as a literal — for the errors the convention gives a band
   * of their own, e.g. a step only a person can finish (`EXIT_NEEDS_HUMAN`).
   */
  exitCode?: number;

  constructor(
    public code: string,
    message: string = ''
  ) {
    super('');
    // If e.toString() was called to get `message` we don't want it to look
    // like "Error: Error:".
    if (message.startsWith(ERROR_PREFIX)) {
      message = message.substring(ERROR_PREFIX.length);
    }

    this.message = message || code;
  }
}

/**
 * What a person must do, and how. Attached to every needs-human failure.
 *
 * @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol
 */
export interface NeedsHuman {
  /** Stable kebab-case scenario id from the registry, e.g. `eas-login`. */
  scenario: string;
  /** One sentence naming what only a person can do. */
  need: string;
  /** The exact command a person runs in their own terminal. Null when only a URL applies. */
  command: string | null;
  /** The exact URL a person opens. Null when only a command applies. */
  url: string | null;
  /** Environment variables that remove the need on a machine with no person. */
  unattendedEnv: string[];
  /** Whether re-running the same `@expo/agent-cli` command works once the person is done. */
  resumable: boolean;
  /**
   * How the scenario was recognised.
   *
   * `detached-child-log` is the one that is not this process' own observation: a `dev --detach` run
   * classifies the stop in the *child*, which prints it to a log file, and the parent hands it on
   * (`src/dev/childVerdict.ts`). Named apart from `exit-signature` because the reader of a handoff
   * deserves to know it was relayed rather than seen.
   */
  detectedBy:
    | 'preflight'
    | 'exit-signature'
    | 'prompt-pattern'
    | 'no-non-interactive-flag'
    | 'detached-child-log';
}

/**
 * A command stopped at a step only a person can complete.
 *
 * Not a tool error: nothing about the call was wrong, and running it again unchanged will stop in
 * exactly the same place until somebody signs in, approves the device, or opens the page. So it
 * leaves the process with {@link EXIT_NEEDS_HUMAN} instead of {@link EXIT_ERROR}, and carries the
 * handoff as data rather than as prose an agent would have to parse.
 *
 * `isNeedsHuman` is the cheap thing to branch on: an agent must not need a code allowlist to know
 * that its user is required.
 *
 * @ref llp/0010-agent-conventions.rfc.md §Needs-human protocol
 */
export class NeedsHumanError extends CommandError {
  name = 'NeedsHumanError';
  readonly isNeedsHuman = true;

  constructor(
    code: string,
    message: string,
    public needsHuman: NeedsHuman
  ) {
    super(code, message);
    // The `Try:` line of the base class and the handoff would say the same thing twice, so
    // `logCmdError` prints the block instead — this keeps the field right for anything reading
    // the error object itself.
    this.suggestedCommand = needsHuman.command ?? undefined;
    this.exitCode = EXIT_NEEDS_HUMAN;
  }
}

/** Whether an error stopped on a person, whatever class it was caught as. */
export function isNeedsHumanError(error: unknown): error is NeedsHumanError {
  return error instanceof CommandError && error.isNeedsHuman === true;
}

/**
 * The last three lines an agent reads: what a person must do, and the two ways to make it
 * unnecessary next time.
 *
 * `label value`, like every other output of this CLI (llp/0006 §Output contract), and the recovery
 * on the last line. The URL rides along in parentheses when nothing can be set instead, so a
 * scenario that is only a web page still names it.
 */
export function formatNeedsHumanBlock(needsHuman: NeedsHuman): string[] {
  const row = (label: string, value: string) => `${label.padEnd(NEEDS_HUMAN_LABEL_WIDTH)}${value}`;
  const ask = needsHuman.command ?? needsHuman.url ?? needsHuman.need;
  // Never twice on one line: a command whose whole job is to open the URL already spells it, and
  // `open "<url>"  (<url>)` reads as two different places to go.
  const parenthesizedUrl =
    needsHuman.url && !ask.includes(needsHuman.url) ? `  (${needsHuman.url})` : '';

  const lines = [row('Needs a human', needsHuman.scenario)];
  if (needsHuman.unattendedEnv.length) {
    lines.push(row('Ask the user', ask));
    lines.push(row('Or set', `${needsHuman.unattendedEnv.join(', ')}${parenthesizedUrl}`));
  } else {
    // No environment variable removes this one, so the URL belongs to the ask itself — unless it
    // *is* the ask, and then repeating it would be the same line twice.
    lines.push(row('Ask the user', ask === needsHuman.url ? ask : `${ask}${parenthesizedUrl}`));
  }
  return lines;
}

/**
 * The one JSON object a failing `--json` run prints on stdout.
 *
 * @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope
 */
export interface JsonErrorEnvelope {
  error: {
    /** The `CommandError` code, e.g. `BAD_ARGS`. The same string the `cli:error` event carries. */
    code: string;
    /** The prose that went to stderr, verbatim, newlines and all. */
    message: string;
    /** The command that most likely resolves this, or null when there is none. */
    suggestedCommand: string | null;
    /** The whole handoff when a person has to finish the step, null otherwise. */
    needsHuman: NeedsHuman | null;
    /** What the failure observed, e.g. the two connection counts of a runtime refusal. */
    data: Record<string, unknown> | null;
  };
}

/**
 * Build the envelope of one failure.
 *
 * The keys never vary — a caller that reads `error.needsHuman` after a plain tool error gets
 * `null`, not a missing key ([[0006-agent-native-cli-surface]] §Output contract).
 */
export function jsonErrorEnvelope({
  code,
  message,
  suggestedCommand,
  needsHuman,
  data,
}: {
  code: string;
  message: string;
  suggestedCommand?: string;
  needsHuman?: NeedsHuman | null;
  data?: Record<string, unknown> | null;
}): JsonErrorEnvelope {
  return {
    error: {
      code,
      message,
      suggestedCommand: suggestedCommand ?? null,
      needsHuman: needsHuman ?? null,
      data: data ?? null,
    },
  };
}

export class AbortCommandError extends CommandError {
  constructor() {
    super('ABORTED', 'Interactive prompt was cancelled.');
  }
}

/**
 * Used to end a CLI process without printing a stack trace in the Expo CLI. Should be used in favor of `process.exit`.
 */
export class SilentError extends CommandError {
  constructor(messageOrError?: string | Error) {
    const message =
      (typeof messageOrError === 'string' ? messageOrError : messageOrError?.message) ??
      'This error should fail silently in the CLI';
    super('SILENT', message);
    if (typeof messageOrError !== 'string') {
      // forward the props of the incoming error for tests or processes outside of expo-cli that use expo cli internals.
      this.stack = messageOrError?.stack ?? this.stack;
      this.name = messageOrError?.name ?? this.name;
    }
  }
}

export function logCmdError(error: any): never {
  if (!(error instanceof Error)) {
    throw error;
  }
  if (error instanceof AbortCommandError || error instanceof SilentError) {
    // Do nothing, this is used for prompts or other cases that were custom logged.
    process.exit(EXIT_ERROR);
  } else if (
    error instanceof CommandError ||
    error instanceof AssertionError ||
    error.name === 'ApiV2Error' ||
    error.name === 'ConfigError'
  ) {
    // Errors are prompts (llp/0006): carry the machine-readable next action on the event
    // stream, and print it as the last line so the agent's recovery is one hop.
    const code = error instanceof CommandError ? error.code : error.name;
    const suggestedCommand = error instanceof CommandError ? error.suggestedCommand : undefined;
    const needsHuman = isNeedsHumanError(error) ? error.needsHuman : null;
    const data = error instanceof CommandError ? error.data : undefined;
    cliEvent('error', {
      code,
      message: error.message,
      suggestedCommand: suggestedCommand ?? null,
      needsHuman: needsHuman != null,
    });
    // The class of the failure gets an event of its own, so a consumer can watch for the one
    // thing it cannot recover from on its own without matching error codes
    // (llp/0010 §Needs-human protocol).
    if (needsHuman) {
      cliEvent('needs_human', { code, ...needsHuman });
    }
    // Print the error first, the recovery command last — the last line is what an
    // agent acts on.
    //
    // Every printed line goes through `renderForInvoker`, so a `How:` that names `npx @expo/agent-cli …`
    // is pasteable in a Bun project. The event above and the envelope below keep the written form:
    // the machine contract does not move with the shell (`src/utils/invoker.ts`).
    exception(renderedError(error));
    if (needsHuman) {
      // Instead of `Try:`, not after it: the block's second line already names the command, and
      // the third says how to make a person unnecessary on the next machine.
      for (const line of formatNeedsHumanBlock(needsHuman)) {
        warn(renderForInvoker(line));
      }
    } else if (suggestedCommand) {
      warn(`Try: ${renderForInvoker(suggestedCommand)}`);
    }
    // @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope — a run asked for
    // machine-readable output gets one, whether it succeeded or not. The prose above stays on
    // stderr, where nothing is parsing; this is the only thing on stdout, so `JSON.parse` of a
    // failing `--json` command works exactly as it does for a successful one.
    if (isJsonRequested()) {
      log(
        JSON.stringify(
          jsonErrorEnvelope({ code, message: error.message, suggestedCommand, needsHuman, data }),
          null,
          2
        )
      );
    }
    // `process.exit` drops buffered JSONL events (the `cli:error` above never reached
    // LOG_EVENTS), so `exitWithCodeAsync` flushes first. It never settles, which keeps the
    // process alive until the exit fires and gives the `.catch(logCmdError)` callers nothing
    // further to run. An error that names no code is a tool error, so it exits 1 (llp/0010).
    const exitCode = error instanceof CommandError ? (error.exitCode ?? EXIT_ERROR) : EXIT_ERROR;
    return exitWithCodeAsync(exitCode) as unknown as never;
  }

  const errorDetails = error.stack ? '\n' + chalk.gray(error.stack) : '';

  exit(chalk.red(error.toString()) + errorDetails);
}

/**
 * The same failure with its suggested commands spelled for the runner in use.
 *
 * A copy rather than a mutation, and only when the spelling actually changes: the error object may
 * be caught and inspected further up, and `logCmdError` is the last thing that touches it — the one
 * place where "what gets printed" and "what the error *is*" are allowed to differ. `exception`
 * prints `name: message` and, under `EXPO_DEBUG`, the stack, so both are carried over.
 */
function renderedError(error: Error): Error {
  const message = renderForInvoker(error.message);
  if (message === error.message) {
    return error;
  }
  const rendered = new Error(message);
  rendered.name = error.name;
  rendered.stack = error.stack;
  return rendered;
}

/** This should never be thrown in production. */
export class UnimplementedError extends Error {
  constructor() {
    super('Unimplemented');
    this.name = 'UnimplementedError';
  }
}

/** The code every crash of this CLI reports under. One code, because the class is the fact. */
export const UNCAUGHT_EXCEPTION_CODE = 'UNCAUGHT_EXCEPTION';

/**
 * Whether this is the macOS watcher-limit error the recovery below is for.
 *
 * These originate from Metro's FSEventsWatcher when `fsevents` goes over the macOS system limit,
 * which is low compared to an average React Native project.
 *
 * @see https://github.com/expo/expo/issues/29083
 * @see https://github.com/facebook/metro/issues/834
 * @see https://github.com/fsevents/fsevents/issues/42#issuecomment-62632234
 */
function isMacOsWatcherLimit(error: unknown): boolean {
  return (
    error != null &&
    typeof error === 'object' &&
    (error as NodeJS.ErrnoException).code === 'EMFILE' &&
    process.platform === 'darwin'
  );
}

/** Reset the watchers and say which of the two states this machine is in. */
function recoverWatchers(error: Error): never {
  try {
    // Try to recover watchman, if it's not installed this will throw
    execSync('watchman shutdown-server', { stdio: 'ignore' });
    // NOTE(cedric): this both starts the watchman server and resets all watchers
    execSync('watchman watch-del-all', { stdio: 'ignore' });

    warn(
      'Watchman is installed but was likely not enabled when starting Metro, try starting your project again.\nIf this problem persists, follow the troubleshooting guide of Watchman: https://facebook.github.io/watchman/docs/troubleshooting'
    );
  } catch {
    warn(
      `Your macOS system limit does not allow enough watchers for Metro, install Watchman instead. Learn more: https://facebook.github.io/watchman/docs/install`
    );
  }

  exception(error);
  return process.exit(EXIT_ERROR) as never;
}

/** Whatever was thrown, as an `Error` — a `throw 'string'` is still a crash to report. */
function asError(thrown: unknown): Error {
  if (thrown instanceof Error) {
    return thrown;
  }
  const error = new Error(typeof thrown === 'string' ? thrown : String(thrown));
  error.name = 'UncaughtException';
  return error;
}

/**
 * The last thing this process does when an error reaches the top of it.
 *
 * @ref llp/0010-agent-conventions.rfc.md §Exit codes
 * @ref llp/0021-honest-reports.rfc.md §The rules
 *
 * **It must not rethrow, and that is the whole design.** Node's exit code for an exception thrown
 * from inside an `uncaughtException` handler is 7 — "Internal Exception Handler Run-Time Failure" —
 * which is exactly the code this convention reserves for a step only a person can complete. The old
 * handler recognised macOS `EMFILE` and rethrew everything else, so every other crash left the
 * process with 7 and none of the three things 7 promises: no handoff, no `cli:needs_human` event, no
 * envelope [observed — live tier, F94, 2026-08-27: `dev:stop` died with `setTypeOfService EINVAL`
 * out of undici's `writeH1` during a `fetch`, and exited 7 with a raw Node stack]. Proven without
 * this CLI in the picture:
 *
 *     node -e "process.on('uncaughtException',(e)=>{throw e}); setImmediate(()=>{throw new Error('x')})"
 *     → exit 7
 *
 * A crash is a **tool error**: the command did not work, and running it again unchanged may or may
 * not help, but no person is being asked for anything. So it is {@link EXIT_ERROR}, with the stack on
 * stderr, because the stack is the only report a crash has — and with the ordinary `--json` envelope
 * on stdout when the run asked for one, so a caller parsing stdout gets an object rather than
 * nothing at all.
 *
 * Synchronous throughout. A handler that scheduled an async flush would hand control back to an
 * event loop that may have nothing left in it, and Node would then exit **0** for a crash.
 *
 * Exported for the tests that pin the exit code; registered on the process below.
 */
export function handleUncaughtException(thrown: unknown): void {
  const error = asError(thrown);
  if (isMacOsWatcherLimit(thrown)) {
    recoverWatchers(error);
    return;
  }

  const errorCode =
    thrown != null && typeof thrown === 'object'
      ? ((thrown as NodeJS.ErrnoException).code ?? null)
      : null;
  const message = [
    `This command crashed: ${error.name}: ${error.message}`,
    `Why: an error reached the top of the process, so the command stopped without reporting what it did. That is a defect in this CLI or in a library it calls, not an answer about the project — and it may have happened after the work itself succeeded.`,
    `How: read the stack below for where it happened, run the command again to see whether it is repeatable, and report it at https://github.com/expo/expo/issues with that stack. Nothing here is waiting on a person: this is exit ${EXIT_ERROR}, a tool error.`,
  ].join('\n');

  // Both, always, and on stderr: `exception` hides the stack outside `EXPO_DEBUG`, and a crash with
  // its stack withheld is a report a reader cannot act on.
  printToStderr(chalk.red(message));
  if (error.stack) {
    printToStderr(chalk.gray(error.stack));
  }

  // @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope — a run that asked for
  // machine-readable output gets one however it ended, so `JSON.parse` of a crashed `--json`
  // command works the way it does for every other failure.
  //
  // **Unless the report already went out.** A crash can land after the command printed, and a second
  // object on stdout would break `JSON.parse` on output that was otherwise complete — which is worse
  // than no envelope, because the caller then has neither the report nor the error
  // [observed while verifying this fix against the published bundle, 2026-08-27: a `status --json`
  // that had finished printing, crashed afterwards, and left two objects on stdout]. The contract is
  // one object; the crash is on stderr either way, and the exit code is 1 either way.
  if (isJsonRequested()) {
    if (hasWrittenToStdout()) {
      printToStderr(
        chalk.gray(
          'This run had already printed its --json report, so the error envelope was not added to stdout: one object on stdout is the contract, and a second would leave nothing there parseable.'
        )
      );
    } else {
      log(
        JSON.stringify(
          jsonErrorEnvelope({
            code: UNCAUGHT_EXCEPTION_CODE,
            message,
            needsHuman: null,
            data: { errorName: error.name, errorCode, stack: error.stack ?? null },
          }),
          null,
          2
        )
      );
    }
  }

  process.exit(EXIT_ERROR);
}

process.on('uncaughtException', handleUncaughtException);
