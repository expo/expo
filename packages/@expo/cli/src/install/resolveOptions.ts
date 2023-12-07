import { NodePackageManagerForProject } from '@expo/package-manager';

import { CommandError } from '../utils/errors';
import { assertUnexpectedVariadicFlags, parseVariadicArguments } from '../utils/variadic';

export type Options = Pick<NodePackageManagerForProject, 'npm' | 'pnpm' | 'yarn' | 'bun'> & {
  /** Check which packages need to be updated, does not install any provided packages. */
  check?: boolean;
  /** Should the dependencies be fixed automatically. */
  fix?: boolean;
  /** Should disable install output, used for commands like `prebuild` that run install internally. */
  silent?: boolean;
};

function resolveOptions(options: Options): Options {
  if (options.fix && options.check) {
    throw new CommandError('BAD_ARGS', 'Specify at most one of: --check, --fix');
  }
  if ([options.npm, options.pnpm, options.yarn, options.bun].filter(Boolean).length > 1) {
    throw new CommandError('BAD_ARGS', 'Specify at most one of: --npm, --pnpm, --yarn, --bun');
  }
  return {
    ...options,
  };
}

export async function resolveArgsAsync(
  argv: string[]
): Promise<{ variadic: string[]; options: Options; extras: string[] }> {
  const { variadic, extras, flags } = parseVariadicArguments(argv);

  assertUnexpectedVariadicFlags(
    ['--check', '--fix', '--npm', '--pnpm', '--yarn', '--bun'],
    { variadic, extras, flags },
    'npx expo install'
  );

  return {
    // Variadic arguments like `npx expo install react react-dom` -> ['react', 'react-dom']
    variadic,
    options: resolveOptions({
      fix: !!flags['--fix'],
      check: !!flags['--check'],
      yarn: !!flags['--yarn'],
      npm: !!flags['--npm'],
      pnpm: !!flags['--pnpm'],
      bun: !!flags['--bun'],
    }),
    extras,
  };
}
