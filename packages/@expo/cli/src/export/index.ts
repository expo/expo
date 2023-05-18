#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import { assertArgs, getProjectRoot, printHelp } from '../utils/args';
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
      '--max-workers': Number,
      '--output-dir': String,
      '--platform': String,
      '--no-minify': Boolean,

      // Hack: This is added because EAS CLI always includes the flag.
      // If supplied, we'll do nothing with the value, but at least the process won't crash.
      // Note that we also don't show this value in the `--help` prompt since we don't want people to use it.
      '--experimental-bundle': Boolean,

      // Aliases
      '-h': '--help',
      // '-s': '--dump-sourcemap',
      // '-d': '--dump-assetmap',
      '-c': '--clear',
      '-p': '--platform',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Export the static files of the app for hosting it on a web server`,
      chalk`npx expo export {dim <dir>}`,
      [
        chalk`<dir>                      Directory of the Expo project. {dim Default: Current working directory}`,
        `--dev                      Configure static files for developing locally using a non-https server`,
        chalk`--output-dir <dir>         The directory to export the static files to. {dim Default: dist}`,
        `--max-workers <number>     Maximum number of tasks to allow the bundler to spawn`,
        `--dump-assetmap            Dump the asset map for further processing`,
        `--dump-sourcemap           Dump the source map for debugging the JS bundle`,
        chalk`-p, --platform <platform>  Options: android, ios, web, all. {dim Default: all}`,
        chalk`--no-minify           Prevent minifying source`,
        `-c, --clear                Clear the bundler cache`,
        `-h, --help                 Usage info`,
      ].join('\n')
    );
  }

  const projectRoot = getProjectRoot(args);
  const { resolveOptionsAsync } = await import('./resolveOptions');
  const options = await resolveOptionsAsync(projectRoot, args).catch(logCmdError);

  const { exportAsync } = await import('./exportAsync');
  return exportAsync(projectRoot, options).catch(logCmdError);
};
