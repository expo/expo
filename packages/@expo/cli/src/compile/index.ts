#!/usr/bin/env node
import chalk from 'chalk';

import type { Command } from '../index';
import { printHelp } from '../utils/args';
import { CommandError, logCmdError } from '../utils/errors';

export const expoCompile: Command = async (argv = []) => {
  try {
    const [platform, ...argsWithoutPlatform] = argv;

    if (!platform || platform.startsWith('-')) {
      printHelp(
        'Build the native app binary locally',
        `npx expo compile <android|ios>`,
        [
          `android     Build the Android app binary`,
          `ios         Build the iOS app binary`,
          `-h, --help  Usage info`,
        ].join('\n'),
        [
          '',
          chalk`  The {bold compile:android} and {bold compile:ios} forms are also supported.`,
          chalk`  Add {bold --help} to either one for its options:`,
          chalk`    {dim $} npx expo compile ios --help`,
          '',
        ].join('\n')
      );
    }

    switch (platform) {
      case 'android': {
        const { expoCompileAndroid } = await import('./android/index.js');
        return expoCompileAndroid(argsWithoutPlatform);
      }

      case 'ios': {
        const { expoCompileIos } = await import('./ios/index.js');
        return expoCompileIos(argsWithoutPlatform);
      }

      default:
        throw new CommandError(
          'UNSUPPORTED_PLATFORM',
          `Unsupported platform: ${platform}. Run \`npx expo compile --help\` for usage.`
        );
    }
  } catch (error: any) {
    logCmdError(error);
  }
};
