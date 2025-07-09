import { CommandError } from '../utils/errors';

const debug = require('debug')('expo:utils:variadic') as typeof console.log;

/** Given a list of CLI args, return a sorted set of args based on categories used in a complex command. */
export function parseVariadicArguments(
  argv: string[],
  strFlags: string[] = []
): {
  variadic: string[];
  extras: string[];
  flags: Record<string, boolean | string | string[] | undefined>;
} {
  const variadic: string[] = [];
  const parsedFlags: Record<string, boolean | string | string[]> = {};

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    if (!arg.startsWith('-')) {
      variadic.push(arg);
    } else if (arg === '--') {
      break;
    } else {
      const flagIndex = strFlags.indexOf(arg.split('=')[0]);
      if (flagIndex !== -1) {
        // Handle flags that expect a value
        const [flag, value] = arg.split('=');
        if (value !== undefined) {
          // If the flag has a value inline (e.g., --flag=value)
          if (parsedFlags[flag] === undefined) {
            parsedFlags[flag] = value;
          } else if (Array.isArray(parsedFlags[flag])) {
            (parsedFlags[flag] as string[]).push(value);
          } else {
            parsedFlags[flag] = [parsedFlags[flag] as string, value];
          }
        } else {
          const nextArg = argv[i + 1];
          if (nextArg && !nextArg.startsWith('-')) {
            if (parsedFlags[arg] === undefined) {
              parsedFlags[arg] = nextArg;
            } else if (Array.isArray(parsedFlags[arg])) {
              (parsedFlags[arg] as string[]).push(nextArg);
            } else {
              parsedFlags[arg] = [parsedFlags[arg] as string, nextArg];
            }
            i++; // Skip the next argument since it's part of the current flag
          } else {
            if (parsedFlags[arg] === undefined) {
              parsedFlags[arg] = true; // Flag without a value
            } else if (Array.isArray(parsedFlags[arg])) {
              (parsedFlags[arg] as (string | boolean)[]).push(true);
            } else {
              parsedFlags[arg] = [parsedFlags[arg] as any, true];
            }
          }
        }
      } else {
        if (parsedFlags[arg] === undefined) {
          parsedFlags[arg] = true; // Unknown flag
        } else if (Array.isArray(parsedFlags[arg])) {
          (parsedFlags[arg] as (string | boolean)[]).push(true);
        } else {
          parsedFlags[arg] = [parsedFlags[arg] as any, true];
        }
      }
    }
    i++;
  }

  // Everything after `--` that is not an option is passed to the underlying install command.
  const extras: string[] = [];
  const extraOperator = argv.indexOf('--');
  if (extraOperator > -1 && argv.length > extraOperator + 1) {
    const extraArgs = argv.slice(extraOperator + 1);
    if (extraArgs.includes('--')) {
      throw new CommandError('BAD_ARGS', 'Unexpected multiple --');
    }
    extras.push(...extraArgs);
    debug('Extra arguments: ' + extras.join(', '));
  }

  debug(`Parsed arguments (variadic: %O, flags: %O, extra: %O)`, variadic, parsedFlags, extras);

  return {
    variadic,
    flags: parsedFlags,
    extras,
  };
}

export function assertUnexpectedObjectKeys(keys: string[], obj: Record<string, any>): void {
  const unexpectedKeys = Object.keys(obj).filter((key) => !keys.includes(key));
  if (unexpectedKeys.length > 0) {
    throw new CommandError('BAD_ARGS', `Unexpected: ${unexpectedKeys.join(', ')}`);
  }
}

export function assertUnexpectedVariadicFlags(
  expectedFlags: string[],
  { extras, flags, variadic }: ReturnType<typeof parseVariadicArguments>,
  prefixCommand = ''
) {
  const unexpectedFlags = Object.keys(flags).filter((key) => !expectedFlags.includes(key));

  if (unexpectedFlags.length > 0) {
    const intendedFlags = Object.entries(flags)
      .filter(([key]) => expectedFlags.includes(key))
      .map(([key]) => key);

    const cmd = [
      prefixCommand,
      ...variadic,
      ...intendedFlags,
      '--',
      ...extras.concat(unexpectedFlags),
    ].join(' ');

    throw new CommandError(
      'BAD_ARGS',
      `Unexpected: ${unexpectedFlags.join(', ')}\nDid you mean: ${cmd.trim()}`
    );
  }
}
