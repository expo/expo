#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import * as Log from '../log';
import { assertArgs, getProjectRoot } from '../utils/args';

export const expoBundle: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--clear': Boolean,
      '--dev': Boolean,
      '--bundle-output': String,
      '--sourcemap-output': String,
      '--assets-output': String,
      '--platform': String,
      '--entry-file': String,
      '--max-workers': Number,
      // Aliases
      '-h': '--help',
      '-c': '--clear',
      '-p': '--platform',
    },
    argv
  );

  if (args['--help']) {
    Log.exit(
      chalk`
      {bold Description}
        Show the project config

      {bold Usage}
        $ npx expo config <dir>

      <dir> is the directory of the Expo project.
      Defaults to the current working directory.

      Options
        --dev                           Bundle in development mode
        -c, --clear                     Output in JSON format
        --bundle-output <path>          File path to generate the JS bundle. {dim ex: ./dist/ios/index.jsbundle}
        --sourcemap-output <path>       Folder path to store sourcemaps referenced in the bundle
        --assets-output <path>          Folder path to store assets referenced in the bundle
        --entry-file <path>             Path to the initial file, either absolute or relative to project root
        --max-workers <num>             Maximum number of tasks to allow the bundler to spawn.
        -p, --platform <android|ios>    Platforms to sync: ios, android.
        -h, --help                      Output usage information
    `,
      0
    );
  }

  // Load modules after the help prompt so `npx expo config -h` shows as fast as possible.
  const [
    // ./bundleAsync
    { bundleAsync },
    // ../utils/errors
    { logCmdError },
  ] = await Promise.all([import('./bundleAsync'), import('../utils/errors')]);

  return bundleAsync(getProjectRoot(args), {
    // Parsed options
    clear: args['--clear'],
    dev: args['--dev'],
    bundleOutput: args['--bundle-output'],
    sourcemapOutput: args['--sourcemap-output'],
    assetsOutput: args['--assets-output'],
    entryFile: args['--entry-file'],
    maxWorkers: args['--max-workers'],
    platform: args['--platform'],
  }).catch(logCmdError);
};
