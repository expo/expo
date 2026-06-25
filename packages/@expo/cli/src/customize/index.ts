#!/usr/bin/env node

import { styleText } from 'node:util';

import type { Command } from '../index';
import { assertWithOptionsArgs, printHelp } from '../utils/args';

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
    printHelp(
      `Generate static project files`,
      `npx expo customize ${styleText('dim', `[files...] -- [options]`)}`,
      [
        `[files...]  List of files to generate`,
        `[options]   Options to pass to the install command`,
        `-h, --help  Usage info`,
      ].join('\n')
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
