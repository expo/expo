import chalk from 'chalk';
import { Command } from '@expo/commander/typings';

import * as IosVersioning from '../versioning/ios';
import { getExpoRepositoryRootDir } from '../Directories';
import { getOldestSDKVersionAsync } from '../ProjectVersions';

interface ActionOptions {
  platform: string;
  sdkVersion?: string;
}

const EXPO_DIR = getExpoRepositoryRootDir();

async function action(options: ActionOptions) {
  if (!options.platform) {
    throw new Error('Run with `--platform <ios | android>`.');
  }

  const sdkVersion = options.sdkVersion || await getOldestSDKVersionAsync(options.platform);

  if (!sdkVersion) {
    throw new Error('Oldest SDK version not found. Try to run with `--sdkVersion <SDK version>`.');
  }

  switch (options.platform) {
    case 'ios':
      return IosVersioning.removeVersionAsync(sdkVersion, EXPO_DIR);
    default:
      throw new Error(`Platform '${options.platform}' is not supported.`);
  }
}

export default (program: Command) => {
  program
    .command('remove-sdk-version')
    .alias('remove-sdk', 'rm-sdk')
    .description('Removes SDK version.')
    .usage(`
    
To remove versioned code for the oldest supported SDK on iOS, run:
${chalk.gray('>')} ${chalk.italic.cyan('et remove-sdk-version --platform ios')}`
    )
    .option('-p, --platform <string>', `Specifies a platform for which the SDK code should be removed. Supported platforms: ${chalk.cyan('ios')}.`)
    .option('-s, --sdkVersion [string]', 'SDK version to remove. Defaults to the oldest supported SDK version.')
    .asyncAction(action);
};
