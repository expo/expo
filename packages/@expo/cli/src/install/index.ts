#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import * as Log from '../log';
import { assertArgs } from '../utils/args';

export const expoInstall: Command = async (argv) => {
  const args = assertArgs(
    {
      // Types
      '--npm': Boolean,
      '--yarn': Boolean,
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    argv
  );

  if (args['--help']) {
    Log.exit(
      chalk`
      {bold Description}
        Install a module or other package to a project

      {bold Usage}
        $ npx expo install {dim [packages...] [options]}

      Options
        --npm       Use npm to install dependencies. {dim Default when package-lock.json exists}
        --yarn      Use Yarn to install dependencies. {dim Default when yarn.lock exists}
        -h, --help  Output usage information

      Additional options can be passed to the underlying install command by using {bold --}
        $ expo install react -- --verbose
        {dim >} yarn add react --verbose
    `,
      0
    );
  }

  // Everything after `--` that is not an option is passed to the underlying install command.
  const extras: string[] = [];

  // Detect unparsed parameters that are passed in
  // Assume anything after the first one to be a parameter (to support cases like `-- --loglevel verbose`)
  argv?.forEach((arg) => {
    if (arg.startsWith('-')) {
      extras.push(arg);
    }
  });

  // Load modules after the help prompt so `npx expo config -h` shows as fast as possible.
  const [
    // ./configAsync
    { installAsync },
    // ../utils/errors
    { logCmdError },
  ] = await Promise.all([import('./installAsync'), import('../utils/errors')]);

  return installAsync(
    // Variadic arguments like `npx expo install react react-dom` -> ['react', 'react-dom']
    args._,
    {
      // Parsed options
      npm: args['--npm'],
      yarn: args['--yarn'],
    },
    extras
  ).catch(logCmdError);
};
