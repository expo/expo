import {
  ConfigPlugin,
  withDangerousMod,
  withMainActivity,
  WarningAggregator,
  ExportedConfigWithProps,
} from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
import fs from 'fs';
import path from 'path';

const DEV_MENU_ANDROID_IMPORT = 'expo.modules.devmenu.react.DevMenuAwareReactActivity';
const DEV_MENU_ACTIVITY_CLASS = 'public class MainActivity extends DevMenuAwareReactActivity {';

const DEV_MENU_POD_IMPORT =
  "pod 'expo-dev-menu', path: '../node_modules/expo-dev-menu', :configurations => :debug";

const DEV_MENU_IOS_IMPORT = `
#if defined(EX_DEV_MENU_ENABLED)
@import EXDevMenu;
#endif`;

const DEV_MENU_IOS_INIT = `
#if defined(EX_DEV_MENU_ENABLED)
  [DevMenuManager configureWithBridge:bridge];
#endif`;

async function readFileAsync(path: string): Promise<string> {
  return fs.promises.readFile(path, 'utf8');
}

async function saveFileAsync(path: string, content: string): Promise<void> {
  return fs.promises.writeFile(path, content, 'utf8');
}

function addJavaImports(javaSource: string, javaImports: string[]): string {
  const lines = javaSource.split('\n');
  const lineIndexWithPackageDeclaration = lines.findIndex(line => line.match(/^package .*;$/));
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

  let lineIndex = lines.findIndex(line => line.match(find));

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
    WarningAggregator.addWarningIOS('ios-devMenu', `Couldn't modified AppDelegate.m - ${e}.`);
  }
}

async function editAppDelegate(
  config: ExportedConfigWithProps,
  action: (appDelegate: string) => string
) {
  const appDelegatePath = path.join(
    config.modRequest.platformProjectRoot,
    config.modRequest.projectName!,
    'AppDelegate.m'
  );

  try {
    const appDelegate = action(await readFileAsync(appDelegatePath));
    return await saveFileAsync(appDelegatePath, appDelegate);
  } catch (e) {
    WarningAggregator.addWarningIOS('ios-devMenu', `Couldn't modified AppDelegate.m - ${e}.`);
  }
}

const withDevMenuActivity: ConfigPlugin = config => {
  return withMainActivity(config, config => {
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
        'android-devMenu',
        `Cannot automatically configure MainActivity if it's not java`
      );
    }

    return config;
  });
};

const withDevMenuPodfile: ConfigPlugin = config => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      await editPodfile(config, podfile => {
        podfile = podfile.replace("platform :ios, '10.0'", "platform :ios, '11.0'");
        podfile = addLines(podfile, 'use_react_native', 0, [`  ${DEV_MENU_POD_IMPORT}`]);
        return podfile;
      });
      return config;
    },
  ]);
};

const withDevMenuAppDelegate: ConfigPlugin = config => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      await editAppDelegate(config, appDelegate => {
        if (!appDelegate.includes(DEV_MENU_IOS_IMPORT)) {
          const lines = appDelegate.split('\n');
          lines.splice(1, 0, DEV_MENU_IOS_IMPORT);

          appDelegate = lines.join('\n');
        }

        if (!appDelegate.includes(DEV_MENU_IOS_INIT)) {
          const lines = appDelegate.split('\n');

          const initializeReactNativeAppIndex = lines.findIndex(line =>
            line.includes('- (RCTBridge *)initializeReactNativeApp')
          );

          const rootViewControllerIndex = lines.findIndex(
            (line, index) =>
              initializeReactNativeAppIndex < index && line.includes('rootViewController')
          );

          lines.splice(rootViewControllerIndex - 1, 0, DEV_MENU_IOS_INIT);

          appDelegate = lines.join('\n');
        }

        return appDelegate;
      });

      return config;
    },
  ]);
};

const withDevMenu = (config: ExpoConfig) => {
  config = withDevMenuActivity(config);
  config = withDevMenuPodfile(config);
  config = withDevMenuAppDelegate(config);
  return config;
};

export default withDevMenu;
