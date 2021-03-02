import { Command } from '@expo/commander';

import iosUpdateNativeDependencies, { Options } from '../ios-update-native-dependencies';

async function asyncAction(options: Options): Promise<void> {
  await iosUpdateNativeDependencies(options);
}

export default (program: Command) => {
  program
    .command('ios-update-native-dependencies')
    .option('-l, --list', 'List all available native dependencies updates.', false)
    .description(
      'Updates iOS native dependencies in all projects/packages. This command bases heavily on results produced by `pod outdated`'
    )
    .asyncAction(asyncAction);
};
