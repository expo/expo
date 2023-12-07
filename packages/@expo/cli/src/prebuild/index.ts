#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import { assertArgs, getProjectRoot, printHelp } from '../utils/args';

export const expoPrebuild: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--clean': Boolean,
      '--npm': Boolean,
      '--pnpm': Boolean,
      '--yarn': Boolean,
      '--bun': Boolean,
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
    printHelp(
      `Create native iOS and Android project files for building natively`,
      chalk`npx expo prebuild {dim <dir>}`,
      [
        chalk`<dir>                                    Directory of the Expo project. {dim Default: Current working directory}`,
        `--no-install                             Skip installing npm packages and CocoaPods`,
        `--clean                                  Delete the native folders and regenerate them before applying changes`,
        chalk`--npm                                    Use npm to install dependencies. {dim Default when package-lock.json exists}`,
        chalk`--yarn                                   Use Yarn to install dependencies. {dim Default when yarn.lock exists}`,
        chalk`--bun                                    Use bun to install dependencies. {dim Default when bun.lockb exists}`,
        chalk`--pnpm                                   Use pnpm to install dependencies. {dim Default when pnpm-lock.yaml exists}`,
        `--template <template>                    Project template to clone from. File path pointing to a local tar file or a github repo`,
        chalk`-p, --platform <all|android|ios>         Platforms to sync: ios, android, all. {dim Default: all}`,
        `--skip-dependency-update <dependencies>  Preserves versions of listed packages in package.json (comma separated list)`,
        `-h, --help                               Usage info`,
      ].join('\n')
    );
  }

  // Load modules after the help prompt so `npx expo prebuild -h` shows as fast as possible.
  const [
    // ./prebuildAsync
    { prebuildAsync },
    // ./resolveOptions
    { resolvePlatformOption, resolvePackageManagerOptions, resolveSkipDependencyUpdate },
    // ../utils/errors
    { logCmdError },
  ] = await Promise.all([
    import('./prebuildAsync.js'),
    import('./resolveOptions.js'),
    import('../utils/errors.js'),
  ]);

  return (() => {
    return prebuildAsync(getProjectRoot(args), {
      // Parsed options
      clean: args['--clean'],

      packageManager: resolvePackageManagerOptions(args),
      install: !args['--no-install'],
      platforms: resolvePlatformOption(args['--platform']),
      // TODO: Parse
      skipDependencyUpdate: resolveSkipDependencyUpdate(args['--skip-dependency-update']),
      template: args['--template'],
    });
  })().catch(logCmdError);
};
