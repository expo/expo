#!/usr/bin/env node

import { styleText } from 'node:util';

import type { Command } from '../index';
import { assertArgs, getProjectRoot, printHelp } from '../utils/args';

export const expoPrebuild: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--clean': Boolean,
      '--no-clean': Boolean,
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
      `npx expo prebuild ${styleText('dim', `<dir>`)}`,
      [
        `<dir>                                    Directory of the Expo project. ${styleText('dim', `Default: Current working directory`)}`,
        `--no-install                             Skip installing npm packages and CocoaPods`,
        `--no-clean                               Apply changes to the existing native folders instead of recreating them`,
        `--npm                                    Use npm to install dependencies. ${styleText('dim', `Default when package-lock.json exists`)}`,
        `--yarn                                   Use Yarn to install dependencies. ${styleText('dim', `Default when yarn.lock exists`)}`,
        `--bun                                    Use bun to install dependencies. ${styleText('dim', `Default when bun.lock or bun.lockb exists`)}`,
        `--pnpm                                   Use pnpm to install dependencies. ${styleText('dim', `Default when pnpm-lock.yaml exists`)}`,
        `--template <template>                    Project template to clone from. File path pointing to a local tar file, npm package or a github repo`,
        `-p, --platform <all|android|ios>         Platforms to sync: ios, android, all. ${styleText('dim', `Default: all`)}`,
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
      clean: !args['--no-clean'],

      packageManager: resolvePackageManagerOptions(args),
      install: !args['--no-install'],
      platforms: resolvePlatformOption(args['--platform']),
      // TODO: Parse
      skipDependencyUpdate: resolveSkipDependencyUpdate(args['--skip-dependency-update']),
      template: args['--template'],
    });
  })().catch(logCmdError);
};
