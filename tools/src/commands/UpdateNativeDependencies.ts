import { Command } from '@expo/commander';

import androidUpdateNativeDependencies, { Options } from '../android-update-native-dependencies';
import { REVISIONS } from '../android-update-native-dependencies/androidProjectReports';

const PLATFORMS = ['android', 'ios'];

function validateOptions(options: Options) {
  if (!REVISIONS.includes(options.revision)) {
    throw new Error(`--revision must be one of ${REVISIONS.join(', ')}`);
  }
  if (!PLATFORMS.includes(options.platform)) {
    throw new Error(`--platform must be one of ${PLATFORMS.join(', ')}`);
  }
}

async function asyncAction(options: Options): Promise<void> {
  validateOptions(options);
  switch (options.platform) {
    case 'android':
      await androidUpdateNativeDependencies(options);
      break;
    case 'ios':
      throw new Error('Not implemented yet');
    default:
  }
}

export default (program: Command) => {
  program
    .command('update-native-dependencies')
    .option(
      '-r, --revision <release>',
      `The revision controls the Ivy resolution strategy for determining what constitutes the latest version of a native dependency. See https://github.com/ben-manes/gradle-versions-plugin#revisions for more. Available values are: ${REVISIONS.join(
        ', '
      )}`,
      'release'
    )
    .option('-l, --list', 'List all available native dependencies updates.', false)
    .option(
      '-c, --clear-cache',
      'By default gradle task results are cached using date-based cache. You can use this flag to clear this cache.',
      false
    )
    .option(
      '-p, --platform [string]',
      'Platform for which the client will be installed.',
      'android'
    )
    .description(
      'Updates Android native dependencies in all projects/packages. This command bases heavily on results produced by https://github.com/ben-manes/gradle-versions-plugin.'
    )
    .asyncAction(asyncAction);
};
