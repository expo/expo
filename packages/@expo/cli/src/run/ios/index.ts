#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';
import path from 'path';

import { Command } from '../../../bin/cli';
import * as Log from '../../log';
import { assertWithOptionsArgs } from '../../utils/args';
import { logCmdError } from '../../utils/errors';
import { resolveStringOrBooleanArgsAsync } from '../../utils/resolveArgs';
import { XcodeConfiguration } from './XcodeBuild.types';

export const expoRunIos: Command = async (argv) => {
  const rawArgsMap: arg.Spec = {
    // Types
    '--help': Boolean,
    '--no-build-cache': Boolean,
    '--no-install': Boolean,
    '--no-bundler': Boolean,
    '--configuration': String,

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
  // '--scheme': String,

  if (args['--help']) {
    Log.exit(
      chalk`
      {bold Description}
        Run the iOS app binary locally

      {bold Usage}
        $ npx expo run:ios

      Options 
        --no-build-cache                 Clear the native derived data before building
        --no-install                     Skip installing dependencies
        --no-bundler                     Skip starting the Metro bundler
        --scheme [scheme]                Scheme to build
        --configuration <configuration>  Xcode configuration to use. Debug or Release. Default: Debug
        -d, --device [device]            Device name or UDID to build the app on
        -p, --port <port>                Port to start the Metro bundler on. Default: 8081
        -h, --help                       Output usage information
    `,
      0
    );
  }

  const parsed = await resolveStringOrBooleanArgsAsync(argv ?? [], rawArgsMap, {
    '--scheme': Boolean,
    '--device': Boolean,
    '-d': '--device',
  }).catch(logCmdError);

  const { runIosAsync } = await import('./runIosAsync');
  return runIosAsync(path.resolve(parsed.projectRoot), {
    // Parsed options
    buildCache: !args['--no-build-cache'],
    install: !args['--no-install'],
    bundler: !args['--no-bundler'],
    port: args['--port'],

    // Custom parsed args
    device: parsed.args['--device'],
    scheme: parsed.args['--scheme'],
    configuration: parsed.args['--configuration'] as XcodeConfiguration,
  }).catch(logCmdError);
};
