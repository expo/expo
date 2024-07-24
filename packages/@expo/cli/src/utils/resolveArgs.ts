import arg, { Spec } from 'arg';

import { replaceValue } from './array';
import { CommandError } from './errors';

/** Split up arguments that are formatted like `--foo=bar` or `-f="bar"` to `['--foo', 'bar']` */
function splitArgs(args: string[]): string[] {
  const result: string[] = [];

  for (const arg of args) {
    if (arg.startsWith('-')) {
      const [key, ...props] = arg.split('=');
      result.push(key);
      if (props.length) {
        result.push(props.join('='));
      }
    } else {
      result.push(arg);
    }
  }

  return result;
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
  args = splitArgs(args);

  // Assert any missing arguments
  assertUnknownArgs(
    {
      ...rawMap,
      ...extraArgs,
    },
    args
  );

  // Collapse aliases into fully qualified arguments.
  args = collapseAliases(extraArgs, args);

  // Resolve all of the string or boolean arguments and the project root.
  return _resolveStringOrBooleanArgs({ ...rawMap, ...extraArgs }, args);
}

/**
 * Enables the resolution of boolean arguments that can be formatted like `--foo=true` or `--foo false`
 *
 * @param args arguments that were passed to the command.
 * @param rawMap raw map of arguments that are passed to the command.
 * @param extraArgs extra arguments and aliases that should be resolved as string or boolean.
 * @returns parsed arguments and project root.
 */
export async function resolveCustomBooleanArgsAsync(
  args: string[],
  rawMap: arg.Spec,
  extraArgs: arg.Spec
) {
  const results = await resolveStringOrBooleanArgsAsync(args, rawMap, extraArgs);

  return {
    ...results,
    args: Object.fromEntries(
      Object.entries(results.args).map(([key, value]) => {
        if (extraArgs[key]) {
          if (typeof value === 'string') {
            if (!['true', 'false'].includes(value)) {
              throw new CommandError(
                'BAD_ARGS',
                `Invalid boolean argument: ${key}=${value}. Expected one of: true, false`
              );
            }
            return [key, value === 'true'];
          }
        }
        return [key, value];
      })
    ),
  };
}

export function _resolveStringOrBooleanArgs(arg: Spec, args: string[]) {
  // Default project root, if a custom one is defined then it will overwrite this.
  let projectRoot: string = '.';
  // The resolved arguments.
  const settings: Record<string, string | boolean | undefined> = {};

  // Create a list of possible arguments, this will filter out aliases.
  const possibleArgs = Object.entries(arg)
    .filter(([, value]) => typeof value !== 'string')
    .map(([key]) => key);

  // Loop over arguments in reverse order so we can resolve if a value belongs to a flag.
  for (let i = args.length - 1; i > -1; i--) {
    const value = args[i];
    // At this point we should have converted all aliases to fully qualified arguments.
    if (value.startsWith('--')) {
      // If we ever find an argument then it must be a boolean because we are checking in reverse
      // and removing arguments from the array if we find a string.
      // We don't override arguments that are already set
      if (!(value in settings)) {
        settings[value] = true;
      }
    } else {
      // Get the previous argument in the array.
      const nextValue = i > 0 ? args[i - 1] : null;
      if (nextValue && possibleArgs.includes(nextValue)) {
        // We don't override arguments that are already set
        if (!(nextValue in settings)) {
          settings[nextValue] = value;
        }
        i--;
      } else if (
        // If the last value is not a flag and it doesn't have a recognized flag before it (instead having a string value or nothing)
        // then it must be the project root.
        i ===
        args.length - 1
      ) {
        projectRoot = value;
      } else {
        // This will asserts if two strings are passed in a row and not at the end of the line.
        throw new CommandError('BAD_ARGS', `Unknown argument: ${value}`);
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
  const unknownArgs = args.filter((arg) => !allowedArgs.includes(arg) && arg.startsWith('-'));
  if (unknownArgs.length > 0) {
    throw new CommandError(`Unknown arguments: ${unknownArgs.join(', ')}`);
  }
}

function getAliasTuples(arg: Spec): [string, string][] {
  return Object.entries(arg).filter(([, value]) => typeof value === 'string') as [string, string][];
}

/** Asserts that a duplicate flag has been used, this naively throws without knowing if an alias or flag were used as the duplicate. */
export function assertDuplicateArgs(args: string[], argNameAliasTuple: [string, string][]) {
  for (const [argName, argNameAlias] of argNameAliasTuple) {
    if (args.filter((a) => [argName, argNameAlias].includes(a)).length > 1) {
      throw new CommandError(
        'BAD_ARGS',
        `Can only provide one instance of ${argName} or ${argNameAlias}`
      );
    }
  }
}
