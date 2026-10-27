import chalk from 'chalk';

import type { Command } from '../index';
import * as Log from '../log';
import { CommandError, logCmdError } from '../utils/errors';
import { getHelp as getAndroidHelp } from './android/help';
import { getHelp as getIosHelp } from './ios/help';

export const expoCompile: Command = async (argv = []) => {
  try {
    const [platform, ...argsWithoutPlatform] = argv;

    if (!platform || platform.startsWith('-')) {
      Log.log(
        [
          '',
          chalk`  {bold Info}`,
          '    Build the native app binary locally',
          '',
          chalk`  {bold Usage}`,
          chalk`    {dim $} npx expo compile {dim <android|ios>}`,
          '',
          getAndroidHelp(false),
          getIosHelp(false),
          chalk`  The {bold compile:android} and {bold compile:ios} forms are also supported.`,
          chalk`  Add {bold --help} to either one for its options:`,
          chalk`    {dim $} npx expo compile ios --help`,
          '',
        ].join('\n')
      );
      return;
    }

    switch (platform) {
      case 'android': {
        const { expoCompileAndroid } = await import('./android/index.js');
        return await expoCompileAndroid(argsWithoutPlatform);
      }

      case 'ios': {
        const { expoCompileIos } = await import('./ios/index.js');
        return await expoCompileIos(argsWithoutPlatform);
      }

      default:
        throw new CommandError(
          'UNSUPPORTED_PLATFORM',
          `Unsupported platform: ${platform}. Run \`npx expo compile --help\` for usage.`
        );
    }
  } catch (error) {
    return logCmdError(error);
  }
};
