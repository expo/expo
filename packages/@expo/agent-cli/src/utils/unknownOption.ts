// @ref llp/0010-agent-conventions.rfc.md §Registry rules
// @ref llp/0006-agent-native-cli-surface.rfc.md §Errors are prompts
// The one place a bad option becomes an error a caller can act on.
//
// `arg` reports both of its user-input failures as a bare sentence — `unknown or unexpected
// option: --port` — and every command in this CLI funnels its parse through one of the two helpers
// in `args.ts`, so the sentence reached the terminal unchanged: no `Why`, no `How`, no `Try`, and
// on the `assertWithOptionsArgs` path not even the `--json` envelope, because that path exited the
// process instead of throwing [observed — friction run 4, 2026-08-23: `typecheck --json --bogus`
// printed nothing on stdout].
//
// Both halves are fixed here rather than per command: a `CommandError` gets the envelope, the
// event and the exit code for free, and there is exactly one wording to keep right.
//
// The second half is {@link OPTION_OWNERS}. `dev --port 8180` is correct and `dev:stop --port 8180`
// was not, and the answer that helps is not "that option does not exist" — it is which command it
// does exist on. That is a small hand-kept table, in the style of `absentCapabilities` in
// `commandRegistry.ts`: only options a caller actually reaches for on the wrong command belong in
// it, and a name nobody confuses does not.

import { PROGRAM_NAME, PROGRAM_PREFIX } from '../programName';
import { CommandError } from './errors';

/** The option name out of `arg`'s own message, e.g. `--bogus`. Null when it named none. */
function optionFrom(message: string): string | null {
  return /(--?[\w-]+)/.exec(message)?.[1] ?? null;
}

/**
 * Commands that take an option, for the options a caller reaches for on the wrong one.
 *
 * Kept by hand and deliberately short. Adding a row is worth it when the option exists on a command
 * a caller plausibly confuses with this one; it is not a second copy of every `--help`.
 */
export const OPTION_OWNERS: { [option: string]: string[] } = {
  '--port': ['dev', 'dev:stop', 'smoke'],
  '--dev-server-url': [
    'smoke',
    'runtime:eval',
    'runtime:errors',
    'runtime:reload',
    'runtime:stop',
    'navigate',
    'status',
  ],
  '--platform': ['smoke', 'runtime:eval', 'runtime:errors'],
  '--route': ['runtime:reload', 'smoke'],
  '--app-id': ['runtime:stop'],
  '--timeout': ['dev:stop', 'runtime:reload', 'smoke'],
  '--json': ['dev', 'dev:stop', 'status', 'typecheck', 'install', 'navigate'],
  // Three more from friction run 5 (F48-2). Each is an option a caller reached for on the
  // *neighbour* of the command that has it, which is the only thing that earns a row here:
  // `--tail` reads like a `dev:logs` option and is one, and `--duration` and `--fail-on-error` are
  // what an agent gating on a window types after the command that opened one.
  '--tail': ['dev:logs'],
  '--fail-on-error': ['runtime:errors'],
  '--duration': ['runtime:errors'],
};

/** The commands other than this one that take an option, or an empty list. */
export function siblingCommandsFor(option: string, command: string): string[] {
  return (OPTION_OWNERS[option] ?? []).filter((owner) => owner !== command);
}

/**
 * The error for an option a command does not have.
 *
 * What / why / how, and a `Try:` line that is always the command's own help — the one command that
 * answers "which options does this take" without another guess.
 */
export function unknownOptionError(command: string, option: string | null): CommandError {
  const siblings = option ? siblingCommandsFor(option, command) : [];
  const named = option ?? 'that option';
  const error = new CommandError(
    'BAD_ARGS',
    [
      `Unknown option ${named} for "${PROGRAM_NAME} ${command}", so nothing ran.`,
      siblings.length
        ? `Why: ${named} is an option of ${siblings.map((name) => `"${PROGRAM_PREFIX} ${name}"`).join(', ')}, not of this command — the two are easy to mix up, and a command that accepted an option it does not act on would report success for a run that ignored it.`
        : `Why: this command acts on the options in its own --help and on nothing else, so accepting ${named} would mean reporting success for a run that ignored it.`,
      `How: run "${PROGRAM_PREFIX} ${command} --help" for the options this command takes${
        siblings.length
          ? `, or run ${siblings.map((name) => `"${PROGRAM_PREFIX} ${name}"`).join(' or ')} if that is the command you meant`
          : ''
      }.`,
    ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} ${command} --help`;
  return error;
}

/** The error for an option that was passed with no value after it. */
export function missingOptionValueError(command: string, option: string | null): CommandError {
  const named = option ?? 'an option';
  const error = new CommandError(
    'BAD_ARGS',
    [
      `${named} was passed to "${PROGRAM_NAME} ${command}" with nothing after it, so nothing ran.`,
      `Why: this option carries a value, and the next argument is the value — there was no next argument, so there is nothing to act on.`,
      `How: give it one, as in "${PROGRAM_PREFIX} ${command} ${named} <value>". Run "${PROGRAM_PREFIX} ${command} --help" for what this option accepts.`,
    ].join('\n')
  );
  error.suggestedCommand = `${PROGRAM_PREFIX} ${command} --help`;
  return error;
}

/**
 * Turn one `arg` user-input failure into a `CommandError`.
 *
 * Only errors whose code starts with `ARG_` and not `ARG_CONFIG_` are the user's; the rest are this
 * CLI's own schema mistakes and are rethrown by the callers.
 *
 * @param command the command as a caller types it, e.g. `dev:stop`.
 * @param message `arg`'s own message.
 * @param code `arg`'s own error code, which is what tells the two user failures apart.
 */
export function argParseError(command: string, message: string, code: string): CommandError {
  const option = optionFrom(message);
  return code === 'ARG_MISSING_REQUIRED_LONGARG' || code === 'ARG_MISSING_REQUIRED_SHORTARG'
    ? missingOptionValueError(command, option)
    : unknownOptionError(command, option);
}
