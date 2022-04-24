#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import * as Log from '../log';
import { assertArgs, getProjectRoot } from '../utils/args';
import { logCmdError } from '../utils/errors';

export const expoExport: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--help': Boolean,
      '--clear': Boolean,
      '--dump-assetmap': Boolean,
      '--dev': Boolean,
      '--dump-sourcemap': Boolean,
      '--quiet': Boolean,
      '--max-workers': Number,
      '--output-dir': String,
      '--merge-src-dir': [String],
      '--merge-src-url': [String],
      // Aliases
      '-h': '--help',
      '-q': '--quiet',
      '-s': '--dump-sourcemap',
      '-d': '--dump-assetmap',
      '-c': '--clear',
    },
    argv
  );

  if (args['--help']) {
    Log.exit(
      chalk`
  {bold Description}
    Export the static files of the app for hosting it on a web server

  {bold Usage}
    $ npx expo export <path>

  <dir> is the directory of the Expo project.
  Defaults to the current working directory.

  {bold Options}
    --platform <all|android|ios>  Platforms: android, ios, all (default: all)
    --dev                         Configure static files for developing locally using a non-https server
    --output-dir <path>           The directory to export the static files to (default: dist)
    --max-workers <number>        Maximum number of tasks to allow Metro to spawn
    --merge-src-dir <path>        Source directory to merge in
    --merge-src-url <url>         Source tar.gz file URL to merge in
    -c, --clear                   Clear the Metro bundler cache
    -d, --dump-assetmap           Dump the asset map for further processing
    -s, --dump-sourcemap          Dump the source map for debugging the JS bundle
    -q, --quiet                   Suppress verbose output
    -h, --help                    Output usage information
`,
      0
    );
  }

  const projectRoot = getProjectRoot(args);
  const { resolveOptionsAsync } = await import('./resolveOptions');
  const options = await resolveOptionsAsync(args).catch(logCmdError);

  const { exportAsync } = await import('./exportAsync');
  return exportAsync(projectRoot, options).catch(logCmdError);
};
