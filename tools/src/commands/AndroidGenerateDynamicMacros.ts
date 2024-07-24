import { Command } from '@expo/commander';
import path from 'path';

import { generateDynamicMacrosAsync } from '../dynamic-macros/generateDynamicMacros';
import { Directories } from '../expotools';

const EXPO_DIR = Directories.getExpoRepositoryRootDir();
const ANDROID_DIR = Directories.getExpoGoAndroidDir();
const GENERATED_DIR = path.join(ANDROID_DIR, 'expoview/src/main/java/host/exp/exponent/generated');
const TEMPLATE_FILES_DIR = path.join(EXPO_DIR, 'template-files');

async function generateAction(options): Promise<void> {
  const buildConstantsPath =
    options.buildConstantsPath || path.join(GENERATED_DIR, 'ExponentBuildConstants.java');
  const configuration = options.configuration || process.env.CONFIGURATION || 'release';

  await generateDynamicMacrosAsync({
    buildConstantsPath,
    platform: 'android',
    expoKitPath: EXPO_DIR,
    templateFilesPath: TEMPLATE_FILES_DIR,
    bareExpo: options.bare,
    configuration,
  });
}

export default (program: Command) => {
  program
    .command('android-generate-dynamic-macros')
    .option(
      '--buildConstantsPath [string]',
      'Path to ExponentBuildConstants.java relative to `android` folder. Optional.'
    )
    .option(
      '--configuration [string]',
      'Build configuration. Defaults to `process.env.CONFIGURATION` or "debug".'
    )
    .option('--bare', 'Generate macros only for the bare-expo project.')
    .description('Generates dynamic macros for Android client.')
    .asyncAction(generateAction);
};
