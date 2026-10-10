import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import prompts from 'prompts';

import { runCommand } from './commands';
import CLIError from './error';
import { withSpinner } from './spinner';
import type { Platform } from './types';

export const validatePrebuild = async (platform: Platform): Promise<void> => {
  if (!checkPrebuild(platform)) {
    console.info(`${chalk.yellow(`⚠ Prebuild for platform: ${platform} is missing`)}`);

    let shouldRunPrebuild: boolean;
    if (isInteractive()) {
      const response = await prompts({
        type: 'confirm',
        name: 'shouldRunPrebuild',
        message: 'Do you want to run the prebuild now?',
        initial: false,
      });
      shouldRunPrebuild = !!response.shouldRunPrebuild;
    } else {
      console.info(
        `Non-interactive shell detected; running \`npx expo prebuild --platform ${platform}\` automatically`
      );
      shouldRunPrebuild = true;
    }

    if (shouldRunPrebuild) {
      await withSpinner({
        // --no-install: node_modules already exist (this CLI runs from them),
        // and on iOS `pod install` is handled by the dedicated validation step
        // below — letting prebuild run it would duplicate the slowest step.
        operation: () =>
          runCommand('npx', ['expo', 'prebuild', '--platform', platform, '--no-install']),
        loaderMessage: `Running 'npx expo prebuild' for platform: ${platform}...`,
        successMessage: `Prebuild for ${platform} completed\n`,
        errorMessage: `Prebuild for ${platform} failed`,
        verbose: false,
      });
    } else {
      CLIError.handle('prebuild-cancelled');
    }
  }
};

const checkPrebuild = (platform: Platform): boolean => {
  const nativeDirectory = path.join(process.cwd(), platform);
  return fs.existsSync(nativeDirectory);
};

const isInteractive = (): boolean => {
  return !!process.stdin.isTTY && !!process.stdout.isTTY;
};
