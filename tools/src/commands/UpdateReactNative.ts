import { Command } from '@expo/commander';
import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import { EXPO_DIR, ANDROID_DIR } from '../Constants';
import { getReactNativeSubmoduleDir } from '../Directories';
import logger from '../Logger';
import { getNextSDKVersionAsync } from '../ProjectVersions';
import { transformFileAsync } from '../Transforms';

type ActionOptions = {
  checkout?: string;
  sdkVersion?: string;
};

const REACT_NATIVE_SUBMODULE_PATH = getReactNativeSubmoduleDir();
const REACT_ANDROID_PATH = path.join(ANDROID_DIR, 'ReactAndroid');
const REACT_COMMON_PATH = path.join(ANDROID_DIR, 'ReactCommon');
const REACT_ANDROID_GRADLE_PATH = path.join(REACT_ANDROID_PATH, 'build.gradle');

async function checkoutReactNativeSubmoduleAsync(checkoutRef: string): Promise<void> {
  await spawnAsync('git', ['fetch'], {
    cwd: REACT_NATIVE_SUBMODULE_PATH,
  });
  await spawnAsync('git', ['checkout', checkoutRef], {
    cwd: REACT_NATIVE_SUBMODULE_PATH,
  });
}

async function updateReactAndroidAsync(sdkVersion: string): Promise<void> {
  console.log(`Cleaning ${chalk.magenta(path.relative(EXPO_DIR, REACT_ANDROID_PATH))}...`);
  await fs.remove(REACT_ANDROID_PATH);

  console.log(`Cleaning ${chalk.magenta(path.relative(EXPO_DIR, REACT_COMMON_PATH))}...`);
  await fs.remove(REACT_COMMON_PATH);

  console.log(
    `Running ${chalk.blue('ReactAndroidCodeTransformer')} with ${chalk.yellow(
      `./gradlew :tools:execute --args ${sdkVersion}`
    )} command...`
  );
  await spawnAsync('./gradlew', [':tools:execute', '--args', sdkVersion], {
    cwd: ANDROID_DIR,
    stdio: 'inherit',
  });

  logger.info(
    '📇 Transforming',
    chalk.magenta('ReactAndroid/build.gradle'),
    'to make use of',
    chalk.yellow('NDK_ABI_FILTERS')
  );
  await transformFileAsync(REACT_ANDROID_GRADLE_PATH, [
    {
      find: /^(def reactNativeArchitectures\(\) {)/m,
      replaceWith: `$1\n    if (System.getenv('NDK_ABI_FILTERS')) { return System.getenv('NDK_ABI_FILTERS'); }`,
    },
  ]);
  await transformFileAsync(REACT_ANDROID_GRADLE_PATH, [
    {
      find: /^(\s*jsRootDir\s*=\s*)file\(.+\)$/m,
      replaceWith: '$1file("$projectDir/../../react-native-lab/react-native/Libraries")',
    },
    {
      find: /^(\s*reactNativeDir\s*=\s*)file\(.+\)$/m,
      replaceWith: '$1file("$projectDir/../../react-native-lab/react-native")',
    },
    {
      find: /^(\s*\/\/ We search for the codegen.*\n\s*\/\/ root packages folder.*\n\s*codegenDir = .*)$/m,
      replaceWith:
        '    codegenDir = file("$projectDir/../../react-native-lab/react-native/packages/react-native-codegen")',
    },
    {
      find: /api\("androidx.appcompat:appcompat:\d+\.\d+\.\d+"\)/,
      replaceWith: 'api("androidx.appcompat:appcompat:1.2.0")',
    },
    {
      find: /compileSdkVersion\s+\d+/,
      replaceWith: 'compileSdkVersion 30',
    },
  ]);
}

async function action(options: ActionOptions) {
  if (options.checkout) {
    console.log(
      `Checking out ${chalk.magenta(
        path.relative(EXPO_DIR, REACT_NATIVE_SUBMODULE_PATH)
      )} submodule at ${chalk.blue(options.checkout)} ref...`
    );
    await checkoutReactNativeSubmoduleAsync(options.checkout);
  }

  // When we're updating React Native, we mostly want it to be for the next SDK that isn't versioned yet.
  const androidSdkVersion = options.sdkVersion || (await getNextSDKVersionAsync('android'));

  if (!androidSdkVersion) {
    throw new Error(
      'Cannot obtain next SDK version. Try to run with --sdkVersion <sdkVersion> flag.'
    );
  }

  console.log(
    `Updating ${chalk.green('ReactAndroid')} for SDK ${chalk.cyan(androidSdkVersion)} ...`
  );
  await updateReactAndroidAsync(androidSdkVersion);
}

export default (program: Command) => {
  program
    .command('update-react-native')
    .alias('update-rn', 'urn')
    .description(
      'Updates React Native submodule and applies Expo-specific code transformations on ReactAndroid and ReactCommon folders.'
    )
    .option(
      '-c, --checkout [string]',
      "Git's ref to the commit, tag or branch on which the React Native submodule should be checkouted."
    )
    .option(
      '-s, --sdkVersion [string]',
      'SDK version for which the forked React Native will be used. Defaults to the newest SDK version increased by a major update.'
    )
    .asyncAction(action);
};
