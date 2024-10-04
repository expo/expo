import { ExpoConfig } from 'expo/config';
import {
  ConfigPlugin,
  createRunOncePlugin,
  ExportedConfigWithProps,
  WarningAggregator,
  withDangerousMod,
  withMainActivity,
} from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';
import semver from 'semver';

import { InstallationPage } from './constants';
import { withDevMenuAppDelegate } from './withDevMenuAppDelegate';

const pkg = require('expo-dev-menu/package.json');

const DEV_MENU_ANDROID_IMPORT = 'expo.modules.devmenu.react.DevMenuAwareReactActivity';
const DEV_MENU_ACTIVITY_CLASS = 'public class MainActivity extends DevMenuAwareReactActivity {';

async function readFileAsync(path: string): Promise<string> {
  return fs.promises.readFile(path, 'utf8');
}

async function saveFileAsync(path: string, content: string): Promise<void> {
  return fs.promises.writeFile(path, content, 'utf8');
}

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

function addLines(content: string, find: string | RegExp, offset: number, toAdd: string[]) {
  const lines = content.split('\n');

  let lineIndex = lines.findIndex((line) => line.match(find));

  for (const newLine of toAdd) {
    if (!content.includes(newLine)) {
      lines.splice(lineIndex + offset, 0, newLine);
      lineIndex++;
    }
  }

  return lines.join('\n');
}

async function editPodfile(config: ExportedConfigWithProps, action: (podfile: string) => string) {
  const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
  try {
    const podfile = action(await readFileAsync(podfilePath));

    return await saveFileAsync(podfilePath, podfile);
  } catch (e) {
    WarningAggregator.addWarningIOS(
      'expo-dev-menu',
      `Couldn't modified AppDelegate.m - ${e}. 
See the expo-dev-client installation instructions to modify your AppDelegate manually: ${InstallationPage}`
    );
  }
}

const withDevMenuActivity: ConfigPlugin = (config) => {
  return withMainActivity(config, (config) => {
    if (config.modResults.language === 'java') {
      let content = config.modResults.contents;
      content = addJavaImports(content, [DEV_MENU_ANDROID_IMPORT]);
      content = content.replace(
        'public class MainActivity extends ReactActivity {',
        DEV_MENU_ACTIVITY_CLASS
      );
      config.modResults.contents = content;
    } else {
      WarningAggregator.addWarningAndroid(
        'expo-dev-menu',
        `Cannot automatically configure MainActivity if it's not java.
See the expo-dev-client installation instructions to modify your MainActivity manually: ${InstallationPage}`
      );
    }

    return config;
  });
};

const withDevMenuPodfile: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      await editPodfile(config, (podfile) => {
        podfile = podfile.replace("platform :ios, '10.0'", "platform :ios, '11.0'");
        // Match both variations of Ruby config:
        // unknown: pod 'expo-dev-menu', path: '../node_modules/expo-dev-menu', :configurations => :debug
        // Rubocop: pod 'expo-dev-menu', path: '../node_modules/expo-dev-menu', configurations: :debug
        if (
          !podfile.match(
            /pod ['"]expo-dev-menu['"],\s?path: ['"][^'"]*node_modules\/expo-dev-menu['"],\s?:?configurations:?\s(?:=>\s)?:debug/
          )
        ) {
          const packagePath = path.dirname(require.resolve('expo-dev-menu/package.json'));
          const relativePath = path.relative(config.modRequest.platformProjectRoot, packagePath);
          podfile = addLines(podfile, 'use_react_native', 0, [
            `  pod 'expo-dev-menu', path: '${relativePath}', :configurations => :debug`,
          ]);
        }
        return podfile;
      });
      return config;
    },
  ]);
};

const withDevMenu = (config: ExpoConfig) => {
  // projects using SDKs before 45 need the old regex-based integration
  // TODO: remove this config plugin once we drop support for SDK 44
  if (config.sdkVersion && semver.lt(config.sdkVersion, '45.0.0')) {
    config = withDevMenuActivity(config);
    config = withDevMenuPodfile(config);
    config = withDevMenuAppDelegate(config);
  }
  return config;
};

export default createRunOncePlugin(withDevMenu, pkg.name, pkg.version);
