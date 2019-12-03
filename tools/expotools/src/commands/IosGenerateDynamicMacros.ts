import path from 'path';
import { Command } from '@expo/commander';

import { Directories } from '../expotools';
import {
  generateDynamicMacrosAsync,
  cleanupDynamicMacrosAsync,
} from '../dynamic-macros/generateDynamicMacros';

const EXPO_DIR = Directories.getExpoRepositoryRootDir();
const IOS_DIR = Directories.getIosDir();
const SUPPORTING_DIR = path.join(IOS_DIR, 'Exponent', 'Supporting');
const TEMPLATE_FILES_DIR = path.join(EXPO_DIR, 'template-files');

async function generateAction(options): Promise<void> {
  const buildConstantsPath =
    options.buildConstantsPath || path.join(SUPPORTING_DIR, 'EXBuildConstants.plist');
  const infoPlistPath = options.infoPlistPath || path.join(SUPPORTING_DIR, 'Info.plist');
  const configuration = options.configuration || process.env.CONFIGURATION;

  await generateDynamicMacrosAsync({
    buildConstantsPath,
    platform: 'ios',
    infoPlistPath: infoPlistPath,
    expoKitPath: EXPO_DIR,
    templateFilesPath: TEMPLATE_FILES_DIR,
    configuration,
    skipTemplates: options.skipTemplate,
  });
}

async function cleanupAction(options): Promise<void> {
  const infoPlistPath = options.infoPlistPath || path.join(SUPPORTING_DIR, 'Info.plist');

  await cleanupDynamicMacrosAsync({
    platform: 'ios',
    infoPlistPath: infoPlistPath,
    expoKitPath: EXPO_DIR,
  });
}

function collect(val, memo) {
  memo.push(val);
  return memo;
}

export default (program: Command) => {
  program
    .command('ios-generate-dynamic-macros')
    .option(
      '--buildConstantsPath [string]',
      'Path to EXBuildConstants.plist relative to `ios` folder. Optional.'
    )
    .option(
      '--infoPlistPath [string]',
      "Path to app's Info.plist relative to `ios` folder. Optional."
    )
    .option(
      '--configuration [string]',
      'Build configuration. Defaults to `process.env.CONFIGURATION`.'
    )
    .option(
      '--skip-template [string]',
      'Skip generating a template (ie) GoogleService-Info.plist. Optional.', collect, []
    )
    .description('Generates dynamic macros for iOS client.')
    .asyncAction(generateAction);

  program
    .command('ios-cleanup-dynamic-macros')
    .description('Restores a backup of Info.plist made before generating dynamic macros.')
    .asyncAction(cleanupAction);
};
