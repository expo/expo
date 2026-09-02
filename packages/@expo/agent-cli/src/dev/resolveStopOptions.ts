// @ref llp/0004-smart-start-and-project-state.rfc.md §Daemonization
// Argument resolution for `@expo/agent-cli dev:stop`. Pure: argv in, options out, `CommandError` for
// anything a user can get wrong.

import { PROGRAM_PREFIX } from '../programName';
import { parseArgsOrThrow, resolveDuration, strayArgumentError } from '../utils/args';
import { CommandError } from '../utils/errors';

/** How long to wait for the dev server to go, when `--timeout` says nothing. */
export const DEFAULT_DEV_STOP_TIMEOUT_MS = 10_000;

/**
 * Signals this command will send.
 *
 * A closed list, not an arbitrary string: the point of the command is that the caller does not
 * have to compose a `kill` invocation, and accepting `SIGHUP` or `SIGUSR2` here would put them
 * back in the business of knowing what a dev server does with one.
 */
export const DEV_STOP_SIGNALS: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGKILL'];

export interface DevStopOptions {
  /**
   * Port to look at when no lock answers, or null to look at none.
   *
   * Null rather than 8081: without a lock this command has not been *told* which dev server the
   * caller means, and guessing 8081 is how a command ends up reporting on — or killing — another
   * project's. Naming the port is the caller saying which one they mean.
   */
  port: number | null;
  /** Signal to send. */
  signal: NodeJS.Signals;
  /** Stop a dev server on `--port` that no lock answers for. */
  force: boolean;
  /** How long to wait for it to go, in milliseconds. */
  timeoutMs: number;
  /** Print the result as one JSON object instead of the human summary (`--json`). */
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
}

const DEV_STOP_ARGS = {
  '--port': String,
  '--signal': String,
  '--force': Boolean,
  '--timeout': String,
  '--json': Boolean,
  '--no-followups': Boolean,
  '-p': '--port',
};

/**
 * Resolve the arguments of `@expo/agent-cli dev:stop`.
 *
 * @throws {CommandError} `BAD_ARGS` for an unusable port, a signal this command does not send, an
 * unusable timeout, or a positional argument it has no place for.
 */
export function resolveDevStopOptions(argv: string[]): DevStopOptions {
  const args = parseArgsOrThrow(DEV_STOP_ARGS, argv, 'dev:stop');

  // @ref llp/0010-agent-conventions.rfc.md §Registry rules.
  if (args._.length > 0) {
    throw strayArgumentError('dev:stop', args._, {
      hint: `this command stops the dev server of the project it runs in. To name a port, pass it as a flag: ${PROGRAM_PREFIX} dev:stop --port ${args._[0]}`,
    });
  }

  const signal = (args['--signal'] ?? 'SIGTERM') as NodeJS.Signals;
  if (!DEV_STOP_SIGNALS.includes(signal)) {
    throw new CommandError(
      'BAD_ARGS',
      `--signal is "${args['--signal']}", which is not one of ${DEV_STOP_SIGNALS.join(', ')}. Leave it out for SIGTERM, which lets the dev server shut its bundler down.`
    );
  }

  return {
    port: args['--port'] == null ? null : parsePort(args['--port']),
    signal,
    force: !!args['--force'],
    timeoutMs: resolveDuration(args['--timeout'], '--timeout', DEFAULT_DEV_STOP_TIMEOUT_MS, {
      allowZero: false,
    }),
    json: !!args['--json'],
    followups: !args['--no-followups'],
  };
}

/** Read `--port` as a TCP port. */
function parsePort(value: unknown): number {
  const port = Number(String(value).trim());
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new CommandError(
      'BAD_ARGS',
      `--port is "${value}", which is not a TCP port. Pass the port the dev server listens on, for example --port 8081.`
    );
  }
  return port;
}
