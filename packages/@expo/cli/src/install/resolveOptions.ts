import * as PackageManager from '@expo/package-manager';

import * as Log from '../log';
import { CommandError } from '../utils/errors';

export type Options = Pick<PackageManager.CreateForProjectOptions, 'npm' | 'yarn'>;

function resolveOptions(options: Options): Options {
  if (options.npm && options.yarn) {
    throw new CommandError('BAD_ARGS', 'Specify at most one of: --npm, --yarn');
  }
  return {
    ...options,
  };
}

export function parseVariadicArguments(argv: string[]): {
  variadic: string[];
  extras: string[];
  flags: Record<string, boolean>;
} {
  const variadic: string[] = [];
  const flags: Record<string, boolean> = {};

  for (const arg of argv) {
    if (!arg.startsWith('-')) {
      variadic.push(arg);
    } else if (arg === '--') {
      break;
    } else {
      flags[arg] = true;
    }
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
    Log.debug('Extra arguments: ' + extras.join(', '));
  }

  Log.debug(`Parsed arguments (variadic: %O, flags: %O, extra: %O)`, variadic, flags, extras);

  return {
    variadic,
    flags,
    extras,
  };
}

export async function resolveArgsAsync(
  argv: string[]
): Promise<{ variadic: string[]; options: Options; extras: string[] }> {
  const { variadic, extras, flags } = parseVariadicArguments(argv);

  assertUnexpectedObjectKeys(['--npm', '--yarn'], flags);

  return {
    // Variadic arguments like `npx expo install react react-dom` -> ['react', 'react-dom']
    variadic: variadic,
    options: resolveOptions({
      yarn: !!flags['--yarn'],
      npm: !!flags['--npm'],
    }),
    extras,
  };
}

function assertUnexpectedObjectKeys(keys: string[], obj: Record<string, any>): void {
  const unexpectedKeys = Object.keys(obj).filter((key) => !keys.includes(key));
  if (unexpectedKeys.length > 0) {
    throw new CommandError('BAD_ARGS', `Unexpected: ${unexpectedKeys.join(', ')}`);
  }
}
