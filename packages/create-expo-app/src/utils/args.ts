// Common utilities for interacting with `args` library.
// These functions should be used by every command.
import arg, { Spec } from 'arg';
import chalk from 'chalk';

import * as Log from '../log';
import { replaceValue } from './array';

/**
 * Parse args and assert unknown options.
 *
 * @param schema the `args` schema for parsing the command line arguments.
 * @param argv extra strings
 * @returns processed args object.
 */
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

/**
 * Enables the resolution of arguments that can either be a string or a boolean.
 *
 * @param args arguments that were passed to the command.
 * @param rawMap raw map of arguments that are passed to the command.
 * @param extraArgs extra arguments and aliases that should be resolved as string or boolean.
 * @returns parsed arguments and project root.
 */
export async function resolveStringOrBooleanArgsAsync(
  args: string[],
  rawMap: arg.Spec,
  extraArgs: arg.Spec
) {
  const combined = {
    ...rawMap,
    ...extraArgs,
  };
  // Assert any missing arguments
  assertUnknownArgs(combined, args);

  // Collapse aliases into fully qualified arguments.
  args = collapseAliases(combined, args);
  // Resolve all of the string or boolean arguments and the project root.
  return _resolveStringOrBooleanArgs(extraArgs, args);
}

export function _resolveStringOrBooleanArgs(multiTypeArgs: Spec, args: string[]) {
  // Default project root, if a custom one is defined then it will overwrite this.
  let projectRoot: string = '';
  // The resolved arguments.
  const settings: Record<string, string | true | undefined> = {};

  // Create a list of possible arguments, this will filter out aliases.
  const possibleArgs = Object.entries(multiTypeArgs)
    .filter(([, value]) => typeof value !== 'string')
    .map(([key]) => key);

  // Loop over arguments in reverse order so we can resolve if a value belongs to a flag.
  for (let i = args.length - 1; i > -1; i--) {
    const value = args[i];
    // At this point we should have converted all aliases to fully qualified arguments.
    if (value.startsWith('--')) {
      // If we ever find an argument then it must be a boolean because we are checking in reverse
      // and removing arguments from the array if we find a string.
      settings[value] = true;
    } else {
      // Get the previous argument in the array.
      const nextValue = i > 0 ? args[i - 1] : null;
      if (nextValue && possibleArgs.includes(nextValue)) {
        settings[nextValue] = value;
        i--;
      } else if (
        // Prevent finding two values that are dangling
        !projectRoot &&
        // If the last value is not a flag and it doesn't have a recognized flag before it (instead having a string value or nothing)
        // then it must be the project root.
        (i === args.length - 1 || i === 0)
      ) {
        projectRoot = value;
      } else {
        // This will asserts if two strings are passed in a row and not at the end of the line.
        throw new Error(`Unknown argument: ${value}`);
      }
    }
  }

  return {
    args: settings,
    projectRoot,
  };
}

/** Convert all aliases to fully qualified flag names. */
export function collapseAliases(arg: Spec, args: string[]): string[] {
  const aliasMap = getAliasTuples(arg);

  for (const [arg, alias] of aliasMap) {
    args = replaceValue(args, arg, alias);
  }

  // Assert if there are duplicate flags after we collapse the aliases.
  assertDuplicateArgs(args, aliasMap);
  return args;
}

/** Assert that the spec has unknown arguments. */
export function assertUnknownArgs(arg: Spec, args: string[]) {
  const allowedArgs = Object.keys(arg);
  const unknownArgs = args.filter(arg => !allowedArgs.includes(arg) && arg.startsWith('-'));
  if (unknownArgs.length > 0) {
    throw new Error(`Unknown arguments: ${unknownArgs.join(', ')}`);
  }
}

function getAliasTuples(arg: Spec): [string, string][] {
  return Object.entries(arg).filter(([, value]) => typeof value === 'string') as [string, string][];
}

/** Asserts that a duplicate flag has been used, this naively throws without knowing if an alias or flag were used as the duplicate. */
export function assertDuplicateArgs(args: string[], argNameAliasTuple: [string, string][]) {
  for (const [argName, argNameAlias] of argNameAliasTuple) {
    if (args.filter(a => [argName, argNameAlias].includes(a)).length > 1) {
      throw new Error(`Can only provide one instance of ${argName} or ${argNameAlias}`);
    }
  }
}
