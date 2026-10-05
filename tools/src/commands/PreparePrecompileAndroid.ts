import { Command } from '@expo/commander';

import { prepareAndroidPrecompileToolchainAsync } from '../prebuilds/AndroidToolchain';
import { prepareAndroidJdkImageAsync } from './PrebuildAndroidPackageForPublish';

export default (program: Command) => {
  program
    .command('prepare-precompile-android')
    .description('Installs Android SDK components and prepares the JDK image before precompiling.')
    .asyncAction(async () => {
      await prepareAndroidPrecompileToolchainAsync();
      await prepareAndroidJdkImageAsync();
    });
};
