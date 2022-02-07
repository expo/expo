#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import * as Log from '../log';
import { assertArgs, getProjectRoot } from '../utils/args';

export const expoPrebuild: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--clean': Boolean,
      '--npm': Boolean,
      '--no-install': Boolean,
      '--template': String,
      '--platform': String,
      '--skip-dependency-update': String,
      // Aliases
      '-h': '--help',
      '-p': '--platform',
      '-t': '--type',
    },
    argv
  );

  if (args['--help']) {
    Log.exit(
      chalk`
      {bold Description}
        Create native iOS and Android project files before building natively.

      {bold Usage}
        $ npx expo prebuild <dir>

      <dir> is the directory of the Expo project.
      Defaults to the current working directory.

      Options
      --no-install                             Skip installing npm packages and CocoaPods.
      --clean                                  Delete the native folders and regenerate them before applying changes
      --npm                                    Use npm to install dependencies. (default when Yarn is not installed)
      --template <template>                    Project template to clone from. File path pointing to a local tar file or a github repo
      -p, --platform <all|android|ios>         Platforms to sync: ios, android, all. Default: all
      --skip-dependency-update <dependencies>  Preserves versions of listed packages in package.json (comma separated list)
      -h, --help                               Output usage information

    `,
      0
    );
  }

  // Load modules after the help prompt so `npx expo prebuild -h` shows as fast as possible.
  const [
    // ./prebuildAsync
    { prebuildAsync },
    // ./resolveOptions
    { resolvePlatformOption, resolveSkipDependencyUpdate },
    // ../utils/errors
    { logCmdError },
  ] = await Promise.all([
    import('./prebuildAsync'),
    import('./resolveOptions'),
    import('../utils/errors'),
  ]);

  return prebuildAsync(getProjectRoot(args), {
    // Parsed options
    clean: args['--clean'],
    packageManager: args['--npm'] ? 'npm' : 'yarn',
    install: !args['--no-install'],
    platforms: resolvePlatformOption(args['--platform']),
    // TODO: Parse
    skipDependencyUpdate: resolveSkipDependencyUpdate(args['--skip-dependency-update']),
    template: args['--template'],
  }).catch(logCmdError);
};
