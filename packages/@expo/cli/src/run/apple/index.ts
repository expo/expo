#!/usr/bin/env node
import arg from 'arg';
import chalk from 'chalk';
import path from 'path';

import { XcodeConfiguration } from './XcodeBuild.types';
import { Command } from '../../../bin/cli';
import { assertWithOptionsArgs, printHelp } from '../../utils/args';
import { CommandError, logCmdError } from '../../utils/errors';

const expoRunApple: (platform: 'ios' | 'macos') => Command =
  (platform: 'ios' | 'macos') => async (argv) => {
    const commandName = platform;
    let platformName: string;
    switch (platform) {
      case 'ios':
        platformName = 'iOS';
        break;
      case 'macos':
        platformName = 'macOS';
        break;
      default:
        throw new CommandError('UNSUPPORTED_PLATFORM', `Unsupported platform: ${platform}`);
    }

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
      printHelp(
        `Run the ${platformName} app binary locally`,
        `npx expo run:${commandName}`,
        [
          `--no-build-cache                 Clear the native derived data before building`,
          `--no-install                     Skip installing dependencies`,
          `--no-bundler                     Skip starting the Metro bundler`,
          `--scheme [scheme]                Scheme to build`,
          chalk`--configuration <configuration>  Xcode configuration to use. Debug or Release. {dim Default: Debug}`,
          `-d, --device [device]            Device name or UDID to build the app on`,
          chalk`-p, --port <port>                Port to start the Metro bundler on. {dim Default: 8081}`,
          `-h, --help                       Usage info`,
        ].join('\n'),
        [
          '',
          chalk`  Build for production (unsigned) with the {bold Release} configuration:`,
          chalk`    {dim $} npx expo run:${commandName} --configuration Release`,
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

    switch (platform) {
      case 'ios':
      case 'macos': {
        const { runAppleAsync } = await import('./runAppleAsync.js');
        return runAppleAsync(platform)(path.resolve(parsed.projectRoot), {
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
      }
      default:
        throw new CommandError('UNSUPPORTED_PLATFORM', `Unsupported platform: ${platform}`);
    }
  };

export const expoRunIos: Command = expoRunApple('ios');
export const expoRunMacos: Command = expoRunApple('macos');
