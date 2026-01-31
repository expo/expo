#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';
import path from 'path';

import { Command } from '../../../bin/cli';
import { assertWithOptionsArgs, printHelp } from '../../utils/args';

export const expoExportCheckForProcessEnv: Command = async (argv) => {
  const rawArgsMap: arg.Spec = {
    // Types
    '--help': Boolean,
    '--clear': Boolean,
    '--dev': Boolean,
    '--max-workers': Number,
    '--platform': [String],

    // Aliases
    '-h': '--help',
    '-c': '--clear',
    '-p': '--platform',
  };

  const args = assertWithOptionsArgs(rawArgsMap, {
    argv,
    permissive: true,
  });

  if (args['--help']) {
    printHelp(
      `Check if the exported bundle contains process.env.* references`,
      chalk`npx expo export:check-for-process-env {dim <dir>}`,
      [
        chalk`<dir>                      Directory of the Expo project. {dim Default: Current working directory}`,
        `--dev                      Configure static files for developing locally using a non-https server`,
        `--max-workers <number>     Maximum number of tasks to allow the bundler to spawn`,
        chalk`-p, --platform <platform>  Options: android, ios, web, all. {dim Default: all}`,
        `-c, --clear                Clear the bundler cache`,
        `-h, --help                 Usage info`,
      ].join('\n')
    );
  }

  const [{ checkForProcessEnvAsync }, { resolveOptionsAsync }, { logCmdError }] = await Promise.all(
    [
      import('./checkForProcessEnvAsync.js'),
      import('./resolveOptions.js'),
      import('../../utils/errors.js'),
    ]
  );

  return (async () => {
    const projectRoot = path.resolve(args._[0] || '.');
    const options = await resolveOptionsAsync(projectRoot, args);
    return checkForProcessEnvAsync(projectRoot, options);
  })().catch(logCmdError);
};
