// @ref llp/0007-deploy-and-headless.rfc.md §new
// Argument resolution for `@expo/agent-cli new`. Pure: argv in, options out, `CommandError` for anything a
// user can get wrong. Every step of the creation is flag-driven, because the point of the command
// is that nothing about it prompts.

import { PROGRAM_PREFIX } from '../programName';
import { parseArgsOrThrow } from '../utils/args';
import { CommandError } from '../utils/errors';

export interface NewOptions {
  /** Directory as typed on the command line, e.g. `apps/my-app`. `create-expo` names the app from it. */
  directory: string;
  /** Display name to write into `app.json`, or undefined to keep the one from the directory. */
  name?: string;
  /** Let `create-expo` install the dependencies, cleared by `--no-install`. */
  install: boolean;
  /** Initialize a git repository when the new project is not in one, cleared by `--no-git`. */
  git: boolean;
  /** Print the result as one JSON object instead of a summary (`--json`). */
  json: boolean;
  /** Attach the state-aware next actions to the output, cleared by `--no-followups`. */
  followups: boolean;
}

const NEW_ARGS = {
  '--name': String,
  '--json': Boolean,
  '--no-install': Boolean,
  '--no-git': Boolean,
  '--no-followups': Boolean,
};

/** The usage line, which is the recovery path for every argument error of this command. */
const USAGE_COMMAND = `${PROGRAM_PREFIX} new <directory>`;

function badArgs(message: string, suggestedCommand = USAGE_COMMAND): CommandError {
  const error = new CommandError('BAD_ARGS', message);
  // Errors are prompts (llp/0006 §Errors are prompts): a bad invocation answers with a good one.
  error.suggestedCommand = suggestedCommand;
  return error;
}

/**
 * Resolve the arguments of `@expo/agent-cli new <directory>`.
 *
 * @throws {CommandError} `BAD_ARGS` for a missing or repeated directory, an empty `--name`, an
 * unknown flag, or an unusable value.
 */
export function resolveNewOptions(argv: string[]): NewOptions {
  let args;
  try {
    args = parseArgsOrThrow(NEW_ARGS, argv, 'new');
  } catch (error: any) {
    if (error instanceof CommandError && !error.suggestedCommand) {
      error.suggestedCommand = `${USAGE_COMMAND} --help`;
    }
    throw error;
  }

  const positional = args._;
  if (positional.length === 0) {
    throw badArgs(
      `Missing directory. The directory is what makes this command headless, so it is never prompted for. Usage: ${USAGE_COMMAND}, for example: ${PROGRAM_PREFIX} new my-app`
    );
  }
  if (positional.length > 1) {
    throw badArgs(
      `Expected one directory, but got ${positional.length} (${positional.join(' ')}). Quote the path so the shell passes it as one argument.`
    );
  }

  const name = args['--name'] == null ? undefined : String(args['--name']).trim();
  if (name != null && !name) {
    throw badArgs(
      `--name was empty. Pass the display name of the app, for example: --name "My App", or leave it out to name the app after the directory.`
    );
  }

  return {
    directory: positional[0]!,
    name,
    install: !args['--no-install'],
    git: !args['--no-git'],
    json: !!args['--json'],
    followups: !args['--no-followups'],
  };
}
