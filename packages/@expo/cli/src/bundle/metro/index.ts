#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../../bin/cli';
import * as Log from '../../log';
import { assertArgs, getProjectRoot } from '../../utils/args';

export const expoBundleMetro: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--clear': Boolean,
      '--dev': Boolean,
      '--minify': Boolean,
      '--bundle-output': String,
      '--bundle-encoding': String,
      '--sourcemap-output': String,
      '--sourcemap-sources-root': String,
      '--sourcemap-use-absolute-path': Boolean,
      '--assets-dest': String,
      // '--assets-output': String,
      '--platform': String,
      '--entry-file': String,
      '--max-workers': Number,
      // Aliases

      '-h': '--help',
      '-c': '--clear',
      '-p': '--platform',
      // Hidden prop names for RN CLI compatibility.
      '--reset-cache': '--clear',
    },
    argv
  );
  // Unsupported RN CLI options:
  // --read-global-cache -- aren't all Metro caches global?
  // --config -- we don't support RN CLI config.
  // --unstable-transform-profile -- unstable.
  // --transformer -- use metro.config.js instead.

  if (args['--help']) {
    Log.exit(
      chalk`
      {bold Description}
        Create the bundle and assets for a project

      {bold Usage}
        $ npx expo bundle:metro <dir>

      <dir> is the directory of the Expo project.
      Defaults to the current working directory.

      Options
        --dev                           Bundle in development mode
        --minify                        Should minify the bundle, default is false in dev mode.
        -c, --clear                     Output in JSON format
        --bundle-output <path>          File path to generate the JS bundle. {dim ex: ./dist/ios/index.jsbundle}
        --bundle-encoding <encoding>    Encoding the bundle should be written in. {dim https://nodejs.org/api/buffer.html#buffer_buffer}
        --sourcemap-output <path>       Folder path to store sourcemaps referenced in the bundle
        --sourcemap-sources-root <path> Path to make sourcemap's sources entries relative to. {dim ex. /root/dir}
        --sourcemap-use-absolute-path   Report SourceMapURL using its full path
        --assets-dest <path>            Folder path to store assets referenced in the bundle
        --entry-file <path>             Path to the initial file, either absolute or relative to project root
        --max-workers <num>             Maximum number of tasks to allow the bundler to spawn.
        -p, --platform <android|ios>    Platforms to sync: ios, android.
        -h, --help                      Output usage information
    `,
      0
    );
  }

  // Load modules after the help prompt so `npx expo bundle -h` shows as fast as possible.
  const [
    // ./bundleAsync
    { bundleAsync },
    // ../utils/errors
    { logCmdError },
  ] = await Promise.all([import('./bundleAsync'), import('../../utils/errors')]);

  return bundleAsync(getProjectRoot(args), {
    // Parsed options
    clear: args['--clear'],
    dev: args['--dev'],
    minify: args['--minify'],
    sourcemapUseAbsolutePath: args['--sourcemap-use-absolute-path'],
    sourcemapSourcesRoot: args['--sourcemap-sources-root'],
    bundleEncoding: args['--bundle-encoding'],
    bundleOutput: args['--bundle-output'],
    sourcemapOutput: args['--sourcemap-output'],
    assetsDest: args['--assets-dest'],
    entryFile: args['--entry-file'],
    maxWorkers: args['--max-workers'],
    platform: args['--platform'],
  }).catch(logCmdError);
};
