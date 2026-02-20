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
    const response = await prompts({
      type: 'confirm',
      name: 'shouldRunPrebuild',
      message: 'Do you want to run the prebuild now?',
      initial: false,
    });

    if (response.shouldRunPrebuild) {
      await withSpinner({
        operation: () => runCommand('npx', ['expo', 'prebuild', '--platform', platform]),
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
