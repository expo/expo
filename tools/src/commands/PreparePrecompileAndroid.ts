import { Command } from '@expo/commander';

import { prepareAndroidJdkImageAsync } from './PrebuildAndroidPackageForPublish';
import { prepareAndroidPrecompileToolchainAsync } from '../prebuilds/AndroidToolchain';

export default (program: Command) => {
  program
    .command('prepare-precompile-android')
    .description('Installs Android SDK components and prepares the JDK image before precompiling.')
    .asyncAction(async () => {
      await prepareAndroidPrecompileToolchainAsync();
      await prepareAndroidJdkImageAsync();
    });
};
