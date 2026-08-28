// @ref llp/0010-agent-conventions.rfc.md §The `--json` error envelope
// @ref llp/0006-agent-native-cli-surface.rfc.md §Errors are prompts
// Which options `@expo/agent-cli dev` accepts, and which of them are the Expo CLI's.
//
// `dev` parses permissively, because most of what it takes belongs to the `expo start` its plan
// ends with. That is right for the flags below and wrong for everything else: an option neither
// CLI has used to be handed to `expo start`, which reported it in its own words a step later —
// after the plan had been decided and printed, and sometimes after a prebuild had already run
// [observed — friction run 5, F48-3]. Worse, a plan that ends in `expo prebuild` or `expo run:*`
// passes the user's options on to nothing at all, so an unknown flag there was *dropped* with a
// warning that read as though it had been understood.
//
// So the two lists below are the whole of what this command accepts, and `assertKnownDevFlags`
// refuses anything else before a single step is decided. Keeping the Expo half as an explicit list
// is the cost of the check: `expo start` owns those names, and a flag added to it upstream has to
// be added here too or `@expo/agent-cli dev` will refuse it. That is a maintenance cost paid on purpose —
// the alternative is what shipped, where every typo was forwarded.

import { unknownOptionError } from '../utils/unknownOption';

/**
 * Options `@expo/agent-cli dev` acts on itself and never forwards.
 *
 * `--port` is deliberately *not* here: it is an `expo start` option that this command also reads
 * (`resolveDevOptions`), so it belongs to the list below and is forwarded as well as acted on.
 *
 * `--go` and `--dev-client` are not here either, and for the same reason: they are `expo start`'s
 * own, and this command *also* reads them as the run target the plan aims at (llp/0015 §The run
 * target). Two flags rather than two new names — `expo start --go` already means "run this in Expo
 * Go", which is exactly what the preference says.
 */
export const DEV_OWN_FLAGS: readonly string[] = [
  '--eas',
  '--local',
  '--no-agent-skills',
  '--no-followups',
  '--no-fingerprint-cache',
  '--plan',
  '--yes',
  '--json',
  '--detach',
  '--wait-ready',
  '--help',
  '-h',
];

/**
 * Options of `expo start` that `@expo/agent-cli dev` forwards to the step its plan ends with.
 *
 * Transcribed from the `assertArgs` schema of `packages/@expo/cli/src/start/index.ts` [observed —
 * expo 57, 2026-08-24], long forms and aliases together, minus `--help`/`-h` which this command
 * answers itself. `<dir>` is a positional there, and positionals are not checked here.
 */
export const EXPO_START_FLAGS: readonly string[] = [
  '--clear',
  '--max-workers',
  '--no-dev',
  '--minify',
  '--https',
  '--private-key-path',
  '--port',
  '--dev-client',
  '--scheme',
  '--android',
  '--ios',
  '--web',
  '--host',
  '--tunnel',
  '--lan',
  '--localhost',
  '--offline',
  '--go',
  '--reset-cache',
  '-c',
  '-p',
  '-a',
  '-i',
  '-w',
  '-m',
  '-d',
  '-g',
];

/** Every option `@expo/agent-cli dev` accepts, from either half. */
const KNOWN_DEV_FLAGS = new Set([...DEV_OWN_FLAGS, ...EXPO_START_FLAGS]);

/**
 * Refuse an option neither this command nor `expo start` has.
 *
 * Three things are deliberately *not* treated as options, so the check never refuses something a
 * caller was entitled to pass:
 *
 * - **Everything after a `--` separator.** That is forwarded to another tool verbatim, which is
 *   what the separator means everywhere else in this CLI (`resolveDevOptions`, `argvRequestsJson`).
 * - **Anything that does not begin with `-`.** A value (`--port 8082`, `--host tunnel`) and the
 *   `<dir>` positional `expo start` takes both look like this. None of the options above takes a
 *   negative number, so nothing that is a value can begin with `-`.
 * - **A bare `-`,** which is a filename convention rather than an option.
 *
 * @throws {CommandError} `BAD_ARGS` naming the option, and the sibling command that has it when
 * one does ({@link import('../utils/unknownOption').OPTION_OWNERS}).
 */
export function assertKnownDevFlags(argv: readonly string[]): void {
  const separator = argv.indexOf('--');
  const own = separator >= 0 ? argv.slice(0, separator) : argv;

  for (const arg of own) {
    if (!arg.startsWith('-') || arg === '-') {
      continue;
    }
    // `--port=8082` is the same option as `--port 8082`, and `arg` accepts both.
    const flag = arg.includes('=') ? arg.slice(0, arg.indexOf('=')) : arg;
    if (!KNOWN_DEV_FLAGS.has(flag)) {
      throw unknownOptionError('dev', flag);
    }
  }
}
