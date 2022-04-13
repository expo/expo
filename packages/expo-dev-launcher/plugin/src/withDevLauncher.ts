import {
  ConfigPlugin,
  createRunOncePlugin,
  ExportedConfigWithProps,
  WarningAggregator,
  withDangerousMod,
  withMainActivity,
} from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import fs from 'fs';
import path from 'path';
import semver from 'semver';

import { InstallationPage } from './constants';
import { resolveExpoUpdatesVersion } from './resolveExpoUpdatesVersion';
import { addLines, replaceLine } from './utils';
import { withDevLauncherAppDelegate } from './withDevLauncherAppDelegate';

const pkg = require('expo-dev-launcher/package.json');

const DEV_LAUNCHER_ANDROID_IMPORT = 'expo.modules.devlauncher.DevLauncherController';
const DEV_LAUNCHER_UPDATES_ANDROID_IMPORT = 'expo.modules.updates.UpdatesDevLauncherController';
const DEV_LAUNCHER_ON_NEW_INTENT = [
  '',
  '  @Override',
  '  public void onNewIntent(Intent intent) {',
  '    super.onNewIntent(intent);',
  '  }',
  '',
].join('\n');
const DEV_LAUNCHER_HANDLE_INTENT = [
  '    if (DevLauncherController.tryToHandleIntent(this, intent)) {',
  '      return;',
  '    }',
].join('\n');
const DEV_LAUNCHER_WRAPPED_ACTIVITY_DELEGATE = (activityDelegateDeclaration: string) =>
  `DevLauncherController.wrapReactActivityDelegate(this, () -> ${activityDelegateDeclaration})`;
const DEV_LAUNCHER_ANDROID_INIT = 'DevLauncherController.initialize(this, getReactNativeHost());';
const DEV_LAUNCHER_UPDATES_ANDROID_INIT = `if (BuildConfig.DEBUG) {
      DevLauncherController.getInstance().setUpdatesInterface(UpdatesDevLauncherController.initialize(this));
    }`;
const DEV_LAUNCHER_UPDATES_DEVELOPER_SUPPORT =
  'return DevLauncherController.getInstance().getUseDeveloperSupport();';

async function readFileAsync(path: string): Promise<string> {
  return fs.promises.readFile(path, 'utf8');
}

async function saveFileAsync(path: string, content: string): Promise<void> {
  return fs.promises.writeFile(path, content, 'utf8');
}

function findClosingBracketMatchIndex(str: string, pos: number) {
  if (str[pos] !== '(') {
    throw new Error("No '(' at index " + pos);
  }
  let depth = 1;
  for (let i = pos + 1; i < str.length; i++) {
    switch (str[i]) {
      case '(':
        depth++;
        break;
      case ')':
        if (--depth === 0) {
          return i;
        }
        break;
    }
  }
  return -1; // No matching closing parenthesis
}

const replaceBetween = (origin: string, startIndex: number, endIndex: number, insertion: string) =>
  `${origin.substring(0, startIndex)}${insertion}${origin.substring(endIndex)}`;

function addJavaImports(javaSource: string, javaImports: string[]): string {
  const lines = javaSource.split('\n');
  const lineIndexWithPackageDeclaration = lines.findIndex((line) => line.match(/^package .*;$/));
  for (const javaImport of javaImports) {
    if (!javaSource.includes(javaImport)) {
      const importStatement = `import ${javaImport};`;
      lines.splice(lineIndexWithPackageDeclaration + 1, 0, importStatement);
    }
  }
  return lines.join('\n');
}

async function editMainApplication(
  config: ExportedConfigWithProps,
  action: (mainApplication: string) => string
): Promise<void> {
  const mainApplicationPath = path.join(
    config.modRequest.platformProjectRoot,
    'app',
    'src',
    'main',
    'java',
    ...config.android!.package!.split('.'),
    'MainApplication.java'
  );

  try {
    const mainApplication = action(await readFileAsync(mainApplicationPath));
    return await saveFileAsync(mainApplicationPath, mainApplication);
  } catch (e) {
    WarningAggregator.addWarningAndroid(
      'expo-dev-launcher',
      `Couldn't modify MainApplication.java - ${e}.
See the expo-dev-client installation instructions to modify your MainApplication.java manually: ${InstallationPage}`
    );
  }
}

async function editPodfile(config: ExportedConfigWithProps, action: (podfile: string) => string) {
  const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
  try {
    const podfile = action(await readFileAsync(podfilePath));
    return await saveFileAsync(podfilePath, podfile);
  } catch (e) {
    WarningAggregator.addWarningIOS(
      'expo-dev-launcher',
      `Couldn't modify AppDelegate.m - ${e}.
See the expo-dev-client installation instructions to modify your AppDelegate.m manually: ${InstallationPage}`
    );
  }
}

const withDevLauncherApplication: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      await editMainApplication(config, (mainApplication) => {
        mainApplication = addJavaImports(mainApplication, [DEV_LAUNCHER_ANDROID_IMPORT]);

        mainApplication = addLines(mainApplication, 'initializeFlipper\\(this', 0, [
          `    ${DEV_LAUNCHER_ANDROID_INIT}`,
        ]);

        let expoUpdatesVersion;
        try {
          expoUpdatesVersion = resolveExpoUpdatesVersion(config.modRequest.projectRoot);
        } catch (e) {
          WarningAggregator.addWarningAndroid(
            'expo-dev-launcher',
            `Failed to check compatibility with expo-updates - ${e}`
          );
        }
        if (expoUpdatesVersion && semver.gt(expoUpdatesVersion, '0.6.0')) {
          mainApplication = addJavaImports(mainApplication, [DEV_LAUNCHER_UPDATES_ANDROID_IMPORT]);
          mainApplication = addLines(mainApplication, 'initializeFlipper\\(this', 0, [
            `    ${DEV_LAUNCHER_UPDATES_ANDROID_INIT}`,
          ]);
          mainApplication = replaceLine(
            mainApplication,
            'return BuildConfig.DEBUG;',
            `      ${DEV_LAUNCHER_UPDATES_DEVELOPER_SUPPORT}`
          );
        }

        return mainApplication;
      });
      return config;
    },
  ]);
};

export function modifyJavaMainActivity(content: string): string {
  content = addJavaImports(content, [DEV_LAUNCHER_ANDROID_IMPORT, 'android.content.Intent']);

  if (!content.includes('onNewIntent')) {
    const lines = content.split('\n');
    const onCreateIndex = lines.findIndex((line) => line.includes('public class MainActivity'));

    lines.splice(onCreateIndex + 1, 0, DEV_LAUNCHER_ON_NEW_INTENT);

    content = lines.join('\n');
  }
  if (!content.includes(DEV_LAUNCHER_HANDLE_INTENT)) {
    content = addLines(content, /super\.onNewIntent\(intent\)/, 0, [DEV_LAUNCHER_HANDLE_INTENT]);
  }

  if (!content.includes('DevLauncherController.wrapReactActivityDelegate')) {
    const activityDelegateMatches = Array.from(
      content.matchAll(/new ReactActivityDelegate(Wrapper)/g)
    );

    if (activityDelegateMatches.length !== 1) {
      WarningAggregator.addWarningAndroid(
        'expo-dev-launcher',
        `Failed to wrap 'ReactActivityDelegate'
See the expo-dev-client installation instructions to modify your MainActivity.java manually: ${InstallationPage}`
      );
      return content;
    }

    const activityDelegateMatch = activityDelegateMatches[0];
    const matchIndex = activityDelegateMatch.index!;
    const openingBracketIndex = matchIndex + activityDelegateMatch[0].length; // next character after `new ReactActivityDelegateWrapper`

    const closingBracketIndex = findClosingBracketMatchIndex(content, openingBracketIndex);
    const reactActivityDelegateDeclaration = content.substring(matchIndex, closingBracketIndex + 1);

    content = replaceBetween(
      content,
      matchIndex,
      closingBracketIndex + 1,
      DEV_LAUNCHER_WRAPPED_ACTIVITY_DELEGATE(reactActivityDelegateDeclaration)
    );
  }
  return content;
}

const withDevLauncherActivity: ConfigPlugin = (config) => {
  return withMainActivity(config, (config) => {
    if (config.modResults.language === 'java') {
      config.modResults.contents = modifyJavaMainActivity(config.modResults.contents);
    } else {
      WarningAggregator.addWarningAndroid(
        'expo-dev-launcher',
        `Cannot automatically configure MainActivity if it's not java.
See the expo-dev-client installation instructions to modify your MainActivity manually: ${InstallationPage}`
      );
    }

    return config;
  });
};

const withDevLauncherPodfile: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      await editPodfile(config, (podfile) => {
        // replace all iOS versions below 12
        podfile = podfile.replace(/platform :ios, '((\d\.0)|(1[0-1].0))'/, "platform :ios, '12.0'");
        // Match both variations of Ruby config:
        // unknown: pod 'expo-dev-launcher', path: '../node_modules/expo-dev-launcher', :configurations => :debug
        // Rubocop: pod 'expo-dev-launcher', path: '../node_modules/expo-dev-launcher', configurations: :debug
        if (
          !podfile.match(
            /pod ['"]expo-dev-launcher['"],\s?path: ['"][^'"]*node_modules\/expo-dev-launcher['"],\s?:?configurations:?\s(?:=>\s)?:debug/
          )
        ) {
          const packagePath = path.dirname(require.resolve('expo-dev-launcher/package.json'));
          const relativePath = path.relative(config.modRequest.platformProjectRoot, packagePath);
          podfile = addLines(podfile, 'use_react_native', 0, [
            `  pod 'expo-dev-launcher', path: '${relativePath}', :configurations => :debug`,
          ]);
        }
        return podfile;
      });
      return config;
    },
  ]);
};

const withDevLauncher = (config: ExpoConfig) => {
  // projects using SDKs before 45 need the old regex-based integration
  // TODO: remove these once we drop support for SDK 44
  if (config.sdkVersion && semver.lt(config.sdkVersion, '45.0.0')) {
    config = withDevLauncherActivity(config);
    config = withDevLauncherApplication(config);
    config = withDevLauncherPodfile(config);
    config = withDevLauncherAppDelegate(config);
  }
  return config;
};

export default createRunOncePlugin(withDevLauncher, pkg.name, pkg.version);
