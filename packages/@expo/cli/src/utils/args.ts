// Common utilities for interacting with `args` library.
// These functions should be used by every command.
import arg from 'arg';
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

export function isBoolOrString(value: any, argName: string, previousValue: any) {
  console.log('do:', value, argName, previousValue);
  /* `value` is always `true` */
  return 'na ' + (previousValue || 'batman!');
}

export function assertWithOptionsArgs(
  schema: arg.Spec,
  options: arg.Options
): arg.Result<arg.Spec> {
  try {
    return arg(schema, options);
  } catch (error: any) {
    // Ensure unknown options are handled the same way.
    if (error.code === 'ARG_UNKNOWN_OPTION') {
      Log.exit(error.message, 1);
    }
    // Otherwise rethrow the error.
    throw error;
  }
}
