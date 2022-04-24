#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import * as Log from '../log';
import { assertWithOptionsArgs } from '../utils/args';

export const expoInstall: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Other options are parsed manually.
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // Allow other options, we'll throw an error if unexpected values are passed.
      permissive: true,
    }
  );

  if (args['--help']) {
    Log.exit(
      chalk`
  {bold Description}
    Install a module or other package to a project

  {bold Usage}
    $ npx expo install {dim [packages...] [options]}

  {bold Options}
    --check     Check which installed packages need to be updated.
    --fix       Automatically update any invalid package versions.
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

  // Load modules after the help prompt so `npx expo install -h` shows as fast as possible.
  const { installAsync } = require('./installAsync') as typeof import('./installAsync');
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { resolveArgsAsync } = require('./resolveOptions') as typeof import('./resolveOptions');

  const { variadic, options, extras } = await resolveArgsAsync(process.argv.slice(3)).catch(
    logCmdError
  );
  return installAsync(variadic, options, extras).catch(logCmdError);
};
