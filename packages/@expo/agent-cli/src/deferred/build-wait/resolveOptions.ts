// Deferred from v1 (2026-08-26) — kept as reference, imported by nothing; see llp/0010
//
// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract
// Argument resolution for `@expo/agent-cli build:wait`. Pure: argv in, options out, `CommandError` for
// anything a caller can get wrong, so every combination is unit-testable without an EAS account.

import { PROGRAM_PREFIX } from '../../programName';
import { parseArgsOrThrow, resolveDuration } from '../../utils/args';
import { CommandError } from '../../utils/errors';
import type { BuildWaitKind } from './types';

/**
 * How long a wait runs before it gives up.
 *
 * Long enough for the builds people actually wait on — a cold iOS build with a full pod install
 * runs past half an hour — and short enough that a wait attached to a build that will never
 * finish ends inside one working session rather than overnight.
 */
export const DEFAULT_TIMEOUT_MS = 45 * 60_000;

/** How often the wait asks, while the answer is still likely to change soon. */
export const DEFAULT_INTERVAL_MS = 10_000;

/** How often it asks after {@link BACKOFF_AFTER_MS}, once the build is plainly a long one. */
export const BACKOFF_INTERVAL_MS = 30_000;

/**
 * When the poll interval backs off.
 *
 * The first minutes are the ones where a queue position moves, and they are also the ones where an
 * agent is most likely to be blocked on the answer. After five minutes the build is compiling and
 * a ten-second poll buys nothing but API calls: 45 minutes at ten seconds is 270 requests, and at
 * the backed-off rate it is 110.
 */
export const BACKOFF_AFTER_MS = 5 * 60_000;

export interface BuildWaitOptions {
  /** The EAS build or submission id to attach to. */
  id: string;
  kind: BuildWaitKind;
  timeoutMs: number;
  /** The interval the first {@link backoffAfterMs} are polled at. */
  intervalMs: number;
  /** The interval the poll backs off to. Equal to `intervalMs` when the caller named one. */
  maxIntervalMs: number;
  /** How long the wait runs before the interval becomes `maxIntervalMs`. */
  backoffAfterMs: number;
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
}

// The durations are read as strings so an unusable value is reported as the user typed it,
// instead of as the `NaN` a numeric handler would produce.
const WAIT_ARGS = {
  '--timeout': String,
  '--interval': String,
  '--submission': Boolean,
  '--json': Boolean,
  '--no-followups': Boolean,
};

/**
 * Resolve the arguments of `@expo/agent-cli build:wait <id>`.
 *
 * @throws {CommandError} `BAD_ARGS` for a missing or duplicated id, an unknown flag, an unusable
 *   duration, or a poll interval that cannot fit inside the wait.
 */
export function resolveBuildWaitOptions(argv: string[]): BuildWaitOptions {
  const args = parseArgsOrThrow(WAIT_ARGS, argv, 'build:wait');
  const kind: BuildWaitKind = args['--submission'] ? 'submission' : 'build';
  const positional = args._;

  if (positional.length === 0) {
    throw missingId(kind);
  }
  if (positional.length > 1) {
    throw new CommandError(
      'BAD_ARGS',
      [
        `Expected one build id, but got ${positional.length} (${positional.join(', ')}).`,
        `Why: a wait attaches to exactly one build, and picking one of several for you would mean reporting an outcome for a build you did not name.`,
        `How: run this once per id, or wait on them in parallel: ${PROGRAM_PREFIX} build:wait ${positional[0]}`,
      ].join('\n')
    );
  }

  const timeoutMs = resolveDuration(args['--timeout'], '--timeout', DEFAULT_TIMEOUT_MS, {
    allowZero: false,
  });
  const intervalMs = resolveDuration(args['--interval'], '--interval', DEFAULT_INTERVAL_MS, {
    allowZero: false,
  });

  if (intervalMs > timeoutMs) {
    throw new CommandError(
      'BAD_ARGS',
      [
        `--interval (${args['--interval']}) is longer than --timeout (${args['--timeout'] ?? `${DEFAULT_TIMEOUT_MS}ms`}), so the build would be asked about once and then given up on.`,
        `Why: the wait polls every --interval until --timeout elapses; an interval that does not fit inside the timeout makes the poll count one, whatever the build is doing.`,
        `How: shorten --interval, or lengthen --timeout so at least a few polls fit inside it.`,
      ].join('\n')
    );
  }

  return {
    id: positional[0]!,
    kind,
    timeoutMs,
    intervalMs,
    // An interval the caller chose is the interval they get: the backoff is a default for the
    // default, not a rate limit, and silently tripling a 50ms poll would be a surprise.
    maxIntervalMs: args['--interval'] ? intervalMs : Math.max(intervalMs, BACKOFF_INTERVAL_MS),
    backoffAfterMs: BACKOFF_AFTER_MS,
    json: !!args['--json'],
    followups: !args['--no-followups'],
  };
}

/**
 * The error for a wait that was given nothing to wait on, pointing at where the ids are.
 *
 * The two kinds get different directions because only one of them has a listing command:
 * `eas build:list --json` prints recent builds [observed — eas-cli README], and eas-cli has no
 * non-interactive equivalent for submissions, so that half names the command that printed the id
 * rather than inventing a listing that does not exist.
 */
function missingId(kind: BuildWaitKind): CommandError {
  const buildListing = 'npx eas build:list --limit 5 --json --non-interactive';
  const how =
    kind === 'submission'
      ? `How: run "${PROGRAM_PREFIX} build:wait <submission-id> --submission". The id is the one "npx eas submit" printed when it started, and the one the submission's page on expo.dev shows.`
      : `How: run "${PROGRAM_PREFIX} build:wait <build-id>". List the recent builds with "${buildListing}".`;

  const error = new CommandError(
    'BAD_ARGS',
    [
      `Missing ${kind} id, so there is nothing to wait for.`,
      `Why: this command attaches to a ${kind} that already exists — one started by CI, by the dashboard, or by another agent — and the id is how it finds it.`,
      how,
    ].join('\n')
  );
  error.suggestedCommand =
    kind === 'submission' ? `${PROGRAM_PREFIX} build:wait --help` : buildListing;
  return error;
}
