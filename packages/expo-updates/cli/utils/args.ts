// Common utilities for interacting with `args` library.
// These functions should be used by every command.
import arg from 'arg';
import { existsSync } from 'fs';
import { resolve } from 'path';

import * as Log from './log';

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
export function assertArgs(schema: arg.Spec, argv: string[]): arg.Result<arg.Spec> {
  try {
    return arg(schema, { argv });
  } catch (error: any) {
    // Ensure unknown options are handled the same way.
    if (error.code === 'ARG_UNKNOWN_OPTION') {
      Log.exit(error.message, 1);
    }
    // Otherwise rethrow the error.
    throw error;
  }
}

export function assertArg(args: arg.Result<arg.Spec>, name: any, type: 'string' | 'number'): any {
  const value = args[name];
  if (value === undefined || value === null) {
    Log.exit(`${name} must not be null`);
  }
  if (typeof value !== type) {
    Log.exit(`${name} must be a ${type}`);
  }
  return value;
}
