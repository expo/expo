import { Command } from '@expo/commander';
import path from 'path';

import { EXPO_DIR, EXPO_GO_IOS_DIR } from '../Constants';
import { generateDynamicMacrosAsync } from '../dynamic-macros/generateDynamicMacros';

const SUPPORTING_DIR = path.join(EXPO_GO_IOS_DIR, 'Exponent', 'Supporting');
const TEMPLATE_FILES_DIR = path.join(EXPO_DIR, 'template-files');

async function generateAction(options): Promise<void> {
  const buildConstantsPath =
    options.buildConstantsPath || path.join(SUPPORTING_DIR, 'EXBuildConstants.plist');
  const infoPlistPath = options.infoPlistPath || path.join(SUPPORTING_DIR, 'Info.plist');
  const configuration = options.configuration || process.env.CONFIGURATION;

  await generateDynamicMacrosAsync({
    buildConstantsPath,
    platform: 'ios',
    infoPlistPath,
    expoKitPath: EXPO_DIR,
    templateFilesPath: TEMPLATE_FILES_DIR,
    configuration,
    skipTemplates: options.skipTemplate,
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
      'Skip generating a template (ie) GoogleService-Info.plist. Optional.',
      collect,
      []
    )
    .description('Generates dynamic macros for iOS client.')
    .asyncAction(generateAction);
};
