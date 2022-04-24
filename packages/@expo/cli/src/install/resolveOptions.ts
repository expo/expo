import * as PackageManager from '@expo/package-manager';

import { CommandError } from '../utils/errors';
import { assertUnexpectedObjectKeys, parseVariadicArguments } from '../utils/variadic';

export type Options = Pick<PackageManager.CreateForProjectOptions, 'npm' | 'yarn'> & {
  /** Check which packages need to be updated, does not install any provided packages. */
  check?: boolean;
  /** Should the dependencies be fixed automatically. */
  fix?: boolean;
};

function resolveOptions(options: Options): Options {
  if (options.fix && options.check) {
    throw new CommandError('BAD_ARGS', 'Specify at most one of: --check, --fix');
  }
  if (options.npm && options.yarn) {
    throw new CommandError('BAD_ARGS', 'Specify at most one of: --npm, --yarn');
  }
  return {
    ...options,
  };
}

export async function resolveArgsAsync(
  argv: string[]
): Promise<{ variadic: string[]; options: Options; extras: string[] }> {
  const { variadic, extras, flags } = parseVariadicArguments(argv);

  assertUnexpectedObjectKeys(['--check', '--fix', '--npm', '--yarn'], flags);

  return {
    // Variadic arguments like `npx expo install react react-dom` -> ['react', 'react-dom']
    variadic,
    options: resolveOptions({
      fix: !!flags['--fix'],
      check: !!flags['--check'],
      yarn: !!flags['--yarn'],
      npm: !!flags['--npm'],
    }),
    extras,
  };
}
