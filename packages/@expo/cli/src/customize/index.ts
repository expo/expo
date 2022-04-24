#!/usr/bin/env node
import chalk from 'chalk';

import { Command } from '../../bin/cli';
import * as Log from '../log';
import { assertWithOptionsArgs } from '../utils/args';

export const expoCustomize: Command = async (argv) => {
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
    Generate static files for the app

  {bold Usage}
    $ npx expo customize {dim [files...] [options]}

  {bold Options}
    -h, --help  Output usage information
    `,
      0
    );
  }

  // Load modules after the help prompt so `npx expo install -h` shows as fast as possible.
  const { customizeAsync } = require('./customizeAsync') as typeof import('./customizeAsync');
  const { logCmdError } = require('../utils/errors') as typeof import('../utils/errors');
  const { resolveArgsAsync } = require('./resolveOptions') as typeof import('./resolveOptions');

  const { variadic, options, extras } = await resolveArgsAsync(process.argv.slice(3)).catch(
    logCmdError
  );
  return customizeAsync(variadic, options, extras).catch(logCmdError);
};
