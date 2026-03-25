import chalk from 'chalk';
import type { Command } from '../../bin/cli';
import { assertWithOptionsArgs, printHelp } from '../utils/args';
import { CommandError, logCmdError } from '../utils/errors';
import { logPlatformBuildCommand } from './hints';

export const expoBuild: Command = async (argv) => {
  const args = assertWithOptionsArgs(
    {
      // Types
      '--help': Boolean,
      // Aliases
      '-h': '--help',
    },
    {
      argv,
      // Allow additional flags for both android and ios commands
      permissive: true,
    }
  );

  try {
    let [platform] = args._ ?? [];

    // Workaround, filter `--flag` as platform
    if (platform?.startsWith('-')) {
      platform = '';
    }

    // Remove the platform from raw arguments, when provided
        const argsWithoutPlatform = !platform ? argv : argv?.splice(1);
    
        // Do not capture `--help` when platform is provided
        if (!platform && args['--help']) {
          printHelp(
            'Run the native app locally',
            `npx expo build <android|ios>`,
            chalk`{dim $} npx expo run <android|ios> --help  Output usage information`
          );
        }
    
        if (!platform) {
          const { selectAsync } = await import('../utils/prompts.js');
          platform = await selectAsync('Select the platform to run', [
            { title: 'Android', value: 'android' },
            { title: 'iOS', value: 'ios' },
          ]);
        }
    
        logPlatformBuildCommand(platform, argsWithoutPlatform);
    
        switch (platform) {
          case 'android': {
            const { expoBuildAndroid } = await import('./android/index.js');
            return expoBuildAndroid(argsWithoutPlatform);
          }
    
          case 'ios': {
            const { expoBuildIos } = await import('./ios/index.js');
            return expoBuildIos(argsWithoutPlatform);
          }
    
          default:
            throw new CommandError('UNSUPPORTED_PLATFORM', `Unsupported platform: ${platform}`);
        }
  } catch (error) {
    logCmdError(error);
  }
};
