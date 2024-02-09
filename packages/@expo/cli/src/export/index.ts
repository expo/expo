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
      '--source-maps': Boolean,
      '--max-workers': Number,
      '--output-dir': String,
      '--platform': [String],
      '--no-minify': Boolean,
      '--no-bytecode': Boolean,

      // Hack: This is added because EAS CLI always includes the flag.
      // If supplied, we'll do nothing with the value, but at least the process won't crash.
      // Note that we also don't show this value in the `--help` prompt since we don't want people to use it.
      '--experimental-bundle': Boolean,

      // Aliases
      '-h': '--help',
      '-s': '--source-maps',
      // '-d': '--dump-assetmap',
      '-c': '--clear',
      '-p': '--platform',
      // Interop with Metro docs and RedBox errors.
      '--reset-cache': '--clear',

      // Deprecated
      '--dump-sourcemap': '--source-maps',
    },
    argv
  );

  if (args['--help']) {
    printHelp(
      `Export the static files of the app for hosting it on a web server`,
      chalk`npx expo export {dim <dir>}`,
      [
        chalk`<dir>                      Directory of the Expo project. {dim Default: Current working directory}`,
        chalk`--output-dir <dir>         The directory to export the static files to. {dim Default: dist}`,
        `--dev                      Configure static files for developing locally using a non-https server`,
        `--no-minify                Prevent minifying source`,
        `--no-bytecode              Prevent generating Hermes bytecode`,
        `--max-workers <number>     Maximum number of tasks to allow the bundler to spawn`,
        `--dump-assetmap            Emit an asset map for further processing`,
        chalk`-p, --platform <platform>  Options: android, ios, web, all. {dim Default: all}`,
        `-s, --source-maps          Emit JavaScript source maps`,
        `-c, --clear                Clear the bundler cache`,
        `-h, --help                 Usage info`,
      ].join('\n')
    );
  }

  const projectRoot = getProjectRoot(args);
  const { resolveOptionsAsync } = await import('./resolveOptions.js');
  const options = await resolveOptionsAsync(projectRoot, args).catch(logCmdError);

  const { exportAsync } = await import('./exportAsync.js');
  return exportAsync(projectRoot, options).catch(logCmdError);
};
