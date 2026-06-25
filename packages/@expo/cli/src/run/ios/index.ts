#!/usr/bin/env node
import type arg from 'arg';
import path from 'path';

import type { XcodeConfiguration } from './XcodeBuild.types';
import type { Command } from '../../index';
import { assertWithOptionsArgs, printHelp } from '../../utils/args';
import { logCmdError } from '../../utils/errors';
import { styleText } from 'node:util';

export const expoRunIos: Command = async (argv) => {
  const rawArgsMap: arg.Spec = {
    // Types
    '--help': Boolean,
    '--no-build-cache': Boolean,
    '--no-install': Boolean,
    '--no-bundler': Boolean,
    '--configuration': String,
    '--binary': String,
    '--output': String,

    '--port': Number,

    // Undocumented flag for re-bundling the app and assets for a build to try different JS code in release builds.
    // Also updates the app.json.
    '--unstable-rebundle': Boolean,
    // Aliases
    '-p': '--port',
    '-o': '--output',

    '-h': '--help',
  };
  const args = assertWithOptionsArgs(rawArgsMap, {
    argv,

    permissive: true,
  });

  // '-d' -> '--device': Boolean,
  // '--scheme': String,

  if (args['--help']) {
    printHelp(
      `Run the iOS app binary locally`,
      `npx expo run:ios`,
      [
        `--no-build-cache                 Clear the native derived data before building`,
        `--no-install                     Skip installing dependencies`,
        `--no-bundler                     Skip starting the Metro bundler`,
        `--scheme [scheme]                Scheme to build`,
        `--binary <path>                  Path to existing .app or .ipa to install.`,
        `--configuration <configuration>  Xcode configuration to use. Debug or Release. ${styleText('dim', `Default: Debug`)}`,
        `-d, --device [device]            Device name, UDID, or "generic" for build-only`,
        `-o, --output <path>              Directory to output the built app binary`,
        `-p, --port <port>                Port to start the Metro bundler on. ${styleText('dim', `Default: 8081`)}`,
        `-h, --help                       Usage info`,
      ].join('\n'),
      [
        '',
        `  Build for production (unsigned) with the ${styleText('bold', `Release`)} configuration:`,
        `    ${styleText('dim', `$`)} npx expo run:ios --configuration Release`,
        '',
        `  Build for simulator without installing (build-only):`,
        `    ${styleText('dim', `$`)} npx expo run:ios --configuration Release --device generic --output ./build`,
        '',
      ].join('\n')
    );
  }

  const { resolveStringOrBooleanArgsAsync } = await import('../../utils/resolveArgs.js');
  const parsed = await resolveStringOrBooleanArgsAsync(argv ?? [], rawArgsMap, {
    '--scheme': Boolean,
    '--device': Boolean,
    '-d': '--device',
  }).catch(logCmdError);

  const { runIosAsync } = await import('./runIosAsync.js');
  return runIosAsync(path.resolve(parsed.projectRoot), {
    // Parsed options
    buildCache: !args['--no-build-cache'],
    install: !args['--no-install'],
    bundler: !args['--no-bundler'],
    port: args['--port'],
    binary: args['--binary'],
    output: args['--output'],
    rebundle: args['--unstable-rebundle'],

    // Custom parsed args
    device: parsed.args['--device'],
    scheme: parsed.args['--scheme'],
    configuration: parsed.args['--configuration'] as XcodeConfiguration,
  }).catch(logCmdError);
};
