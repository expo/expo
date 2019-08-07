import { Directories, ExpoKit } from '../expotools';

const EXPO_DIR = Directories.getExpoRepositoryRootDir();

async function action(options) {
  if (!options.reactNativeUnimodulesVersion || !options.sdkVersion) {
    throw new Error('--reactNativeUnimodulesVersion and --sdkVersion are both required');
  }

  await ExpoKit.updateReactNativeUnimodulesAsync(EXPO_DIR, options.reactNativeUnimodulesVersion, options.sdkVersion);
}

export default (program: any) => {
  program
    .command('update-react-native-unimodules-expokit')
    .description('Update react-native-unimodules version installed while ejecting')
    .option('--reactNativeUnimodulesVersion [string]', 'react-native-unimodules version to install')
    .option('--sdkVersion [string]', 'SDK version that will use this dependency')
    .asyncAction(action);
};
