import envinfo from 'envinfo';
import { constants, promises } from 'fs';
import path from 'path';

import { findFile } from './helpers';

const packageJSON = require('../package.json');

function getEnvironmentInfoAsync(): Promise<string> {
  return envinfo.run(
    {
      System: ['OS', 'Shell'],
      Binaries: ['Node', 'Yarn', 'npm', 'Watchman'],
      IDEs: ['Xcode', 'Android Studio'],
      Managers: ['CocoaPods'],
      SDKs: ['iOS SDK', 'Android SDK'],
      npmPackages: [
        'expo',
        'react',
        'react-dom',
        'react-native',
        'react-native-web',
        'react-navigation',
        '@expo/webpack-config',
        '@expo/metro-config',
        'babel-preset-expo',
        'metro',
      ],
      npmGlobalPackages: ['expo-cli', 'eas-cli'],
    },
    {
      title: `expo-env-info ${packageJSON.version} environment info`,
    }
  );
}

/* Poor mans implementation to prevent bloating the package size */
export async function isInsideProjectAsync(projectRoot: string): Promise<boolean> {
  try {
    await promises.access(
      path.join(projectRoot || process.cwd(), './package.json'),
      constants.F_OK
    );
    return true;
  } catch (error) {
    return false;
  }
}

export async function isBareWorkflowProject(projectRoot: string): Promise<boolean | null> {
  const iosFound = await findFile(path.join(projectRoot, 'ios'), '.xcodeproj');
  const androidFound = await findFile(path.join(projectRoot, 'android'), '.gradle');

  return iosFound || androidFound;
}

export async function actionAsync(projectRoot: string): Promise<void> {
  // envinfo does not support passing in a path,
  // it's hardcoded to look at process.cwd(),
  // so we change to the desired folder
  process.chdir(projectRoot ?? process.cwd());

  const info = await getEnvironmentInfoAsync();
  const lines = info.split('\n');

  if (await isInsideProjectAsync(projectRoot)) {
    const workflow = (await isBareWorkflowProject(projectRoot)) ? 'bare' : 'managed';
    lines.pop();
    lines.push(`    Expo Workflow: ${workflow}`);
  }

  console.log(lines.join('\n') + '\n');
}
