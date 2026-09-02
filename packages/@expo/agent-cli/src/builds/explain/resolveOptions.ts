// @ref llp/0012-build-explain.rfc.md §What ships, and what is reserved
// Argument resolution for `@expo/agent-cli inspect:build-log`. Pure: argv in, options out, `CommandError` for
// anything a caller can get wrong, so every combination is unit-testable without a log.

import path from 'node:path';

import { PROGRAM_NAME, PROGRAM_PREFIX } from '../../programName';
import { parseArgsOrThrow } from '../../utils/args';
import { CommandError } from '../../utils/errors';
import { DEFAULT_CONTEXT_AFTER, DEFAULT_CONTEXT_BEFORE } from './extract';

export interface ExplainOptions {
  source: { kind: 'file'; path: string } | { kind: 'stdin' };
  /** The `--platform` hint, which narrows the rule table. Null when the caller passed none. */
  platform: 'ios' | 'android' | null;
  contextBefore: number;
  contextAfter: number;
  /** Report every match, not only the one the failing phase produced. */
  all: boolean;
  json: boolean;
  followups: boolean;
}

const EXPLAIN_ARGS = {
  '--file': String,
  '--stdin': Boolean,
  '--platform': String,
  '--context': String,
  '--all': Boolean,
  '--json': Boolean,
  '--no-followups': Boolean,
  '-f': '--file',
  '-p': '--platform',
};

export interface ResolveExplainContext {
  /** Whether stdin is a terminal. Injected so the resolver stays pure and testable. */
  stdinIsTTY: boolean;
  /** Where a relative `--file` is resolved from. */
  cwd: string;
}

/**
 * Resolve the arguments of `@expo/agent-cli inspect:build-log`.
 *
 * @throws {CommandError} `BAD_ARGS` for two input sources, an unusable `--platform` or
 *   `--context`, or no input source at all on a terminal; `BUILD_ID_UNSUPPORTED` for the
 *   reserved positional.
 */
export function resolveExplainOptions(
  argv: string[],
  { stdinIsTTY, cwd }: ResolveExplainContext
): ExplainOptions {
  const args = parseArgsOrThrow(EXPLAIN_ARGS, argv, 'inspect:build-log');
  const positional = args._.map(String);

  if (positional.length > 0) {
    throw buildIdUnsupported(positional[0]!);
  }

  const file = args['--file'];
  const stdin = !!args['--stdin'];
  if (file && stdin) {
    throw new CommandError(
      'BAD_ARGS',
      [
        `Both --file and --stdin were passed, and a report is about one log.`,
        `Why: reading two sources would mean either concatenating logs from different builds or silently ignoring one of them, and both produce a report that is about no single run.`,
        `How: pass "--file ${file}" to read that file, or "--stdin" to read what is piped in.`,
      ].join('\n')
    );
  }

  const source = resolveSource({ file, stdin, stdinIsTTY, cwd });
  const platform = resolvePlatform(args['--platform']);
  const context = resolveContext(args['--context']);

  return {
    source,
    platform,
    contextBefore: context?.before ?? DEFAULT_CONTEXT_BEFORE,
    contextAfter: context?.after ?? DEFAULT_CONTEXT_AFTER,
    all: !!args['--all'],
    json: !!args['--json'],
    followups: !args['--no-followups'],
  };
}

/**
 * Which of the two sources this run reads.
 *
 * With neither flag, a run whose stdin is *not* a terminal is being piped to, so `--stdin` is
 * implied — `eas build:view … | @expo/agent-cli inspect:build-log` is the shape the command is for. A run on
 * a terminal with neither flag has nothing to read and is told so, rather than blocking forever
 * on a stdin nobody is going to write to.
 */
function resolveSource({
  file,
  stdin,
  stdinIsTTY,
  cwd,
}: {
  file?: string;
  stdin: boolean;
  stdinIsTTY: boolean;
  cwd: string;
}): ExplainOptions['source'] {
  if (file) {
    return { kind: 'file', path: path.resolve(cwd, file) };
  }
  if (stdin || !stdinIsTTY) {
    return { kind: 'stdin' };
  }
  const error = new CommandError(
    'BAD_ARGS',
    [
      `No log to explain: neither --file nor --stdin was passed, and stdin is a terminal.`,
      `Why: this command reads a build log and reports what failed in it. On a terminal there is nothing being piped in, so waiting on stdin would hang instead of answering.`,
      `How: run "${PROGRAM_PREFIX} inspect:build-log --file <path>", or pipe a log in: "cat build.log | ${PROGRAM_PREFIX} inspect:build-log".`,
    ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} inspect:build-log --help`;
  throw error;
}

/** The platform hint, or null. */
function resolvePlatform(value?: string): 'ios' | 'android' | null {
  if (value == null) {
    return null;
  }
  const platform = value.toLowerCase();
  if (platform === 'ios' || platform === 'android') {
    return platform;
  }
  throw new CommandError(
    'BAD_ARGS',
    [
      `--platform ${value} is not a platform this command knows.`,
      `Why: the hint narrows the rule table to the phases that platform has — pod install and xcodebuild for ios, gradle for android — so a value outside that set would narrow it to nothing.`,
      `How: pass "--platform ios" or "--platform android", or leave it off and let the log decide.`,
    ].join('\n')
  );
}

/**
 * How many lines of context to report, from `--context <n>` or `--context <before>:<after>`.
 *
 * One number sets both. The default is asymmetric (8 before, 20 after) because a compiler puts
 * its detail under its diagnostic, and the two-part form is how a caller keeps that asymmetry
 * while changing the size.
 */
function resolveContext(value?: string): { before: number; after: number } | null {
  if (value == null) {
    return null;
  }
  const parts = value.split(':');
  if (parts.length > 2) {
    throw badContext(value);
  }
  const numbers = parts.map((part) => {
    if (!/^\d+$/.test(part.trim())) {
      throw badContext(value);
    }
    return Number(part.trim());
  });
  const before = numbers[0]!;
  return { before, after: numbers[1] ?? before };
}

function badContext(value: string): CommandError {
  return new CommandError(
    'BAD_ARGS',
    [
      `--context ${value} is not a line count.`,
      `Why: the value says how many lines around the match to report, so it has to be a whole number of lines, or two of them separated by a colon.`,
      `How: pass "--context 12" for twelve lines each side, or "--context 8:20" for eight before and twenty after.`,
    ].join('\n')
  );
}

/**
 * The error for the positional argument this command reserves but does not read yet.
 *
 * The build-id form is the whole reason the argument is reserved rather than rejected as a stray:
 * `@expo/agent-cli inspect:build-log <build-id>` is the command an agent will reach for, and it will exist.
 * Until it does, saying so precisely — and naming the two forms that work today — is a better
 * answer than the generic "reads no positional arguments" of `positionalArgs: 'none'`, which
 * would send the reader looking for a typo instead of for the flag.
 *
 * @see llp/0010-agent-conventions.rfc.md §Upstream asks, `eas build:logs`
 */
function buildIdUnsupported(value: string): CommandError {
  const error = new CommandError(
    'BUILD_ID_UNSUPPORTED',
    [
      `"${PROGRAM_NAME} inspect:build-log ${value}" cannot fetch a build's logs yet, so it has nothing to explain.`,
      `Why: eas-cli has no "build:logs" command, so there is no supported way for this CLI to read an EAS build's log. The argument is reserved for when there is; it is not a typo.`,
      `How: save the log and pass it in — "npx eas build:view ${value}" prints where the log files are — then run "${PROGRAM_PREFIX} inspect:build-log --file <path>". A local build's output pipes straight in: "npx expo run:ios 2>&1 | ${PROGRAM_PREFIX} inspect:build-log".`,
    ].join('\n')
  );
  error.suggestedCommand = `npx eas build:view ${value}`;
  return error;
}
