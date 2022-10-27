import { ConfigPlugin, WarningAggregator, withAppDelegate } from 'expo/config-plugins';

import { InstallationPage } from './constants';

const DEV_MENU_IOS_IMPORT = `
#if defined(EX_DEV_MENU_ENABLED)
@import EXDevMenu;
#endif`;

const DEV_MENU_IOS_INIT = `
#if defined(EX_DEV_MENU_ENABLED)
  [DevMenuManager configureWithBridge:bridge];
#endif`;

const DEV_LAUNCHER_IMPORT = `#include <EXDevLauncher/EXDevLauncherController.h>`;
export function modifyAppDelegate(appDelegate: string) {
  if (!appDelegate.includes(DEV_MENU_IOS_IMPORT)) {
    const lines = appDelegate.split('\n');
    lines.splice(1, 0, DEV_MENU_IOS_IMPORT);

    appDelegate = lines.join('\n');
  }

  if (!appDelegate.includes(DEV_LAUNCHER_IMPORT)) {
    // expo-dev-launcher isn't present - we need to init expo-dev-menu
    if (!appDelegate.includes(DEV_MENU_IOS_INIT)) {
      const lines = appDelegate.split('\n');

      const initializeReactNativeAppIndex = lines.findIndex((line) =>
        line.includes('- (RCTBridge *)initializeReactNativeApp')
      );

      const rootViewControllerIndex = lines.findIndex(
        (line, index) =>
          initializeReactNativeAppIndex < index && line.includes('rootViewController')
      );

      lines.splice(rootViewControllerIndex - 1, 0, DEV_MENU_IOS_INIT);

      appDelegate = lines.join('\n');
    }
  } else {
    // expo-dev-launcher is present - we need to remove expo-dev-menu init block
    appDelegate = appDelegate.replace(DEV_MENU_IOS_INIT, '');
  }

  return appDelegate;
}

export const withDevMenuAppDelegate: ConfigPlugin = (config) => {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language === 'objc') {
      config.modResults.contents = modifyAppDelegate(config.modResults.contents);
    } else {
      WarningAggregator.addWarningIOS(
        'expo-dev-menu',
        `Swift AppDelegate files are not supported yet.
See the expo-dev-client installation instructions to modify your AppDelegate manually: ${InstallationPage}`
      );
    }
    return config;
  });
};
