#!/usr/bin/env node
import chalk from 'chalk';

import type { Command } from '../index';
import { assertArgs, getProjectRoot, printHelp } from '../utils/args';
import { logCmdError } from '../utils/errors';
import { getConfigEnvMode, loadEnvFiles } from '../utils/nodeEnv';

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
      chalk`npx expo prebuild {dim <dir>}`,
      [
        chalk`<dir>                                    Directory of the Expo project. {dim Default: Current working directory}`,
        `--no-install                             Skip installing npm packages and CocoaPods`,
        `--no-clean                               Apply changes to the existing native folders instead of recreating them`,
        chalk`--npm                                    Use npm to install dependencies. {dim Default when package-lock.json exists}`,
        chalk`--yarn                                   Use Yarn to install dependencies. {dim Default when yarn.lock exists}`,
        chalk`--bun                                    Use bun to install dependencies. {dim Default when bun.lock or bun.lockb exists}`,
        chalk`--pnpm                                   Use pnpm to install dependencies. {dim Default when pnpm-lock.yaml exists}`,
        `--template <template>                    Project template to clone from. File path pointing to a local tar file, npm package or a github repo`,
        chalk`-p, --platform <all|android|ios>         Platforms to sync: ios, android, all. {dim Default: all}`,
        `--skip-dependency-update <dependencies>  Preserves versions of listed packages in package.json (comma separated list)`,
        `-h, --help                               Usage info`,
      ].join('\n')
    );
  }

  return (async () => {
    const projectRoot = getProjectRoot(args);
    loadEnvFiles(projectRoot, { mode: getConfigEnvMode() });

    const [
      { prebuildAsync },
      { resolvePlatformOption, resolvePackageManagerOptions, resolveSkipDependencyUpdate },
    ] = await Promise.all([import('./prebuildAsync.js'), import('./resolveOptions.js')]);

    return prebuildAsync(projectRoot, {
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
