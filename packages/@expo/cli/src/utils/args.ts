// Common utilities for interacting with `args` library.
// These functions should be used by every command.
import arg from 'arg';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { resolve } from 'path';

import * as Log from '../log';

/**
 * Parse the first argument as a project directory.
 *
 * @returns valid project directory.
 */
export function getProjectRoot(args: arg.Result<arg.Spec>) {
  const projectRoot = resolve(args._[0] || '.');

  if (!existsSync(projectRoot)) {
    Log.exit(`Invalid project root: ${projectRoot}`);
  }

  return projectRoot;
}

/**
 * Parse args and assert unknown options.
 *
 * @param schema the `args` schema for parsing the command line arguments.
 * @param argv extra strings
 * @returns processed args object.
 */
export function assertArgs(schema: arg.Spec, argv?: string[]): arg.Result<arg.Spec> {
  return assertWithOptionsArgs(schema, { argv });
}

export function assertWithOptionsArgs(
  schema: arg.Spec,
  options: arg.Options
): arg.Result<arg.Spec> {
  try {
    return arg(schema, options);
  } catch (error: any) {
    // Handle errors caused by user input.
    // Only errors from `arg`, which does not start with `ARG_CONFIG_` are user input errors.
    // See: https://github.com/vercel/arg/releases/tag/5.0.0
    if ('code' in error && error.code.startsWith('ARG_') && !error.code.startsWith('ARG_CONFIG_')) {
      Log.exit(error.message, 1);
    }
    // Otherwise rethrow the error.
    throw error;
  }
}

export function printHelp(info: string, usage: string, options: string, extra: string = ''): never {
  Log.exit(
    chalk`
  {bold Info}
    ${info}

  {bold Usage}
    {dim $} ${usage}

  {bold Options}
    ${options.split('\n').join('\n    ')}
` + extra,
    0
  );
}
