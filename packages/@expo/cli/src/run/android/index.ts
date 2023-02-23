#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';
import path from 'path';

import { Command } from '../../../bin/cli';
import * as Log from '../../log';
import { assertWithOptionsArgs } from '../../utils/args';
import { logCmdError } from '../../utils/errors';

export const expoRunAndroid: Command = async (argv) => {
  const rawArgsMap: arg.Spec = {
    // Types
    '--help': Boolean,
    '--no-build-cache': Boolean,
    '--no-install': Boolean,
    '--no-bundler': Boolean,
    '--variant': String,
    '--template': String,

    '--port': Number,
    // Aliases
    '-p': '--port',

    '-h': '--help',
  };
  const args = assertWithOptionsArgs(rawArgsMap, {
    argv,

    permissive: true,
  });

  // '-d' -> '--device': Boolean,

  if (args['--help']) {
    Log.exit(
      chalk`
  {bold Description}
    Run the native Android app locally

  {bold Usage}
    $ npx expo run:android <dir>

  {bold Options} 
    --no-build-cache       Clear the native build cache
    --no-install           Skip installing dependencies
    --no-bundler           Skip starting the bundler
    --variant <name>       Build variant. {dim Default: debug}
    -d, --device [device]  Device name to run the app on
    -p, --port <port>      Port to start the dev server on. {dim Default: 8081}
    --template <path|URL>  Base template for the native project if it doesnt exists. {dim Default: bare-minimum}

    -h, --help             Output usage information
`,
      0
    );
  }

  const { resolveStringOrBooleanArgsAsync } = await import('../../utils/resolveArgs');
  const parsed = await resolveStringOrBooleanArgsAsync(argv ?? [], rawArgsMap, {
    '--device': Boolean,
    '-d': '--device',
  }).catch(logCmdError);

  const { runAndroidAsync } = await import('./runAndroidAsync');

  return runAndroidAsync(path.resolve(parsed.projectRoot), {
    // Parsed options
    buildCache: !args['--no-build-cache'],
    install: !args['--no-install'],
    bundler: !args['--no-bundler'],
    port: args['--port'],
    variant: args['--variant'],
    template: args['--template'],

    // Custom parsed args
    device: parsed.args['--device'],
  }).catch(logCmdError);
};
