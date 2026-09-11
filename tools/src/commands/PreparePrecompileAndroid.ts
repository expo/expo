import { Command } from '@expo/commander';

import { prepareAndroidPrecompileToolchainAsync } from '../prebuilds/AndroidToolchain';

export default (program: Command) => {
  program
    .command('prepare-precompile-android')
    .description('Installs the repository-configured Android SDK components before precompiling.')
    .asyncAction(prepareAndroidPrecompileToolchainAsync);
};
