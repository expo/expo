import { Directories, ExpoKit } from '../expotools';

const EXPO_DIR = Directories.getExpoRepositoryRootDir();

async function action(options) {
  if (!options.appVersion || !options.sdkVersion) {
    throw new Error('--appVersion and --sdkVersion are both required');
  }

  await ExpoKit.updateExpoKitAndroidAsync(EXPO_DIR, options.appVersion, options.sdkVersion, options.expokitVersion, options.expokitTag);
}

export default (program: any) => {
  program
    .command('android-update-expokit')
    .description('Update staging ExpoKit files')
    .option('--appVersion [string]', 'Android app version from app/build.gradle')
    .option('--sdkVersion [string]', 'SDK version that will use this ExpoKit code')
    .option('--expokitVersion [string]', 'Version for the expokit npm package (optional)')
    .option('--expokitTag [string]', 'Tag for the expokit npm package (optional)')
    .asyncAction(action);
};
