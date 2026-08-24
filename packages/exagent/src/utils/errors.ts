import { AssertionError } from 'assert';
import chalk from 'chalk';
import { execSync } from 'child_process';

import { event as cliEvent } from '../events';
import { EXIT_ERROR, EXIT_NEEDS_HUMAN, exitWithCodeAsync } from '../exitCodes';
import { exit, exception, log, warn } from '../log';
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
  /** Whether re-running the same `exagent` command works once the person is done. */
  resumable: boolean;
  /** How the scenario was recognised. */
  detectedBy: 'preflight' | 'exit-signature' | 'prompt-pattern' | 'no-non-interactive-flag';
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
  const parenthesizedUrl = needsHuman.url ? `  (${needsHuman.url})` : '';

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
}: {
  code: string;
  message: string;
  suggestedCommand?: string;
  needsHuman?: NeedsHuman | null;
}): JsonErrorEnvelope {
  return {
    error: {
      code,
      message,
      suggestedCommand: suggestedCommand ?? null,
      needsHuman: needsHuman ?? null,
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
    exception(error);
    if (needsHuman) {
      // Instead of `Try:`, not after it: the block's second line already names the command, and
      // the third says how to make a person unnecessary on the next machine.
      for (const line of formatNeedsHumanBlock(needsHuman)) {
        warn(line);
      }
    } else if (suggestedCommand) {
      warn(`Try: ${suggestedCommand}`);
    }
    // @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope — a run asked for
    // machine-readable output gets one, whether it succeeded or not. The prose above stays on
    // stderr, where nothing is parsing; this is the only thing on stdout, so `JSON.parse` of a
    // failing `--json` command works exactly as it does for a successful one.
    if (isJsonRequested()) {
      log(
        JSON.stringify(
          jsonErrorEnvelope({ code, message: error.message, suggestedCommand, needsHuman }),
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

/** This should never be thrown in production. */
export class UnimplementedError extends Error {
  constructor() {
    super('Unimplemented');
    this.name = 'UnimplementedError';
  }
}

/**
 * Add additional information when EMFILE errors are encountered.
 * These errors originate from Metro's FSEventsWatcher due to `fsevents` going over MacOS system limit.
 * Unfortunately, these limits in macOS are relatively low compared to an average React Native project.
 *
 * @see https://github.com/expo/expo/issues/29083
 * @see https://github.com/facebook/metro/issues/834
 * @see https://github.com/fsevents/fsevents/issues/42#issuecomment-62632234
 */
function handleTooManyOpenFileErrors(error: any) {
  // Only enable special logging when running on macOS and are running into the `EMFILE` error
  if ('code' in error && error.code === 'EMFILE' && process.platform === 'darwin') {
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
    process.exit(EXIT_ERROR);
  }

  throw error;
}

process.on('uncaughtException', handleTooManyOpenFileErrors);
