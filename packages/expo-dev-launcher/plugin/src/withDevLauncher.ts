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

const DEV_LAUNCHER_ANDROID_IMPORT = 'expo.modules.devlauncher.DevLauncherController';
const DEV_LAUNCHER_ON_NEW_INTENT = `
  @Override
  public void onNewIntent(Intent intent) {
      if (DevLauncherController.tryToHandleIntent(this, intent)) {
         return;
      }
      super.onNewIntent(intent);
  }
`;
const DEV_LAUNCHER_WRAPPED_ACTIVITY_DELEGATE = `DevLauncherController.wrapReactActivityDelegate(this, () -> $1);`;
const DEV_LAUNCHER_ANDROID_INIT = 'DevLauncherController.initialize(this, getReactNativeHost());';

const DEV_LAUNCHER_POD_IMPORT =
  "pod 'expo-dev-menu', path: '../node_modules/expo-dev-menu', :configurations => :debug";
const DEV_LAUNCHER_APP_DELEGATE_SOURCE_FOR_URL = `  #if defined(EX_DEV_LAUNCHER_ENABLED)
return [[EXDevLauncherController sharedInstance] sourceUrl];
#else
return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#endif`;
const DEV_LAUNCHER_APP_DELEGATE_ON_DEEP_LINK = `#if defined(EX_DEV_LAUNCHER_ENABLED)
if ([EXDevLauncherController.sharedInstance onDeepLink:url options:options]) {
return true;
}
#endif
return [RCTLinkingManager application:application openURL:url options:options];`;
const DEV_LAUNCHER_APP_DELEGATE_IOS_IMPORT = `
#if defined(EX_DEV_LAUNCHER_ENABLED)
#include <EXDevLauncher/EXDevLauncherController.h>
#endif`;
const DEV_LAUNCHER_APP_DELEGATE_CONTROLLER_DELEGATE = `
#if defined(EX_DEV_LAUNCHER_ENABLED)
@implementation AppDelegate (EXDevLauncherControllerDelegate)

- (void)devLauncherController:(EXDevLauncherController *)developmentClientController
      didStartWithSuccess:(BOOL)success
{
developmentClientController.appBridge = [self initializeReactNativeApp];
EXSplashScreenService *splashScreenService = (EXSplashScreenService *)[UMModuleRegistryProvider getSingletonModuleForClass:[EXSplashScreenService class]];
[splashScreenService showSplashScreenFor:self.window.rootViewController];
}

@end
#endif
`;
const DEV_LAUNCHER_APP_DELEGATE_INIT = `#if defined(EX_DEV_LAUNCHER_ENABLED)
      EXDevLauncherController *contoller = [EXDevLauncherController sharedInstance];
      [contoller startWithWindow:self.window delegate:self launchOptions:launchOptions];
    #else
      [self initializeReactNativeApp];
    #endif`;

const DEV_LAUNCHER_APP_DELEGATE_BRIDGE = `#if defined(EX_DEV_LAUNCHER_ENABLED)
  NSDictionary *launchOptions = [EXDevLauncherController.sharedInstance getLaunchOptions];
#else
  NSDictionary *launchOptions = self.launchOptions;
#endif

  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];`;

async function readFileAsync(path: string): Promise<string> {
  return fs.promises.readFile(path, 'utf8');
}

async function saveFileAsync(path: string, content: string): Promise<void> {
  return fs.promises.writeFile(path, content, 'utf8');
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
    WarningAggregator.addWarningIOS(
      'ios-devMenu',
      `Couldn't modified MainApplication.java - ${e}.`
    );
  }
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

const withDevLauncherApplication: ConfigPlugin = config => {
  return withDangerousMod(config, [
    'android',
    async config => {
      await editMainApplication(config, mainApplication => {
        mainApplication = addJavaImports(mainApplication, [DEV_LAUNCHER_ANDROID_IMPORT]);

        mainApplication = addLines(mainApplication, 'super.onCreate()', 1, [
          `    ${DEV_LAUNCHER_ANDROID_INIT}`,
        ]);

        return mainApplication;
      });
      return config;
    },
  ]);
};

const withDevLauncherActivity: ConfigPlugin = config => {
  return withMainActivity(config, config => {
    if (config.modResults.language === 'java') {
      let content = addJavaImports(config.modResults.contents, [
        DEV_LAUNCHER_ANDROID_IMPORT,
        'android.content.Intent',
      ]);

      if (!content.includes(DEV_LAUNCHER_ON_NEW_INTENT)) {
        const lines = content.split('\n');
        const onCreateIndex = lines.findIndex(line => line.includes('public class MainActivity'));

        lines.splice(onCreateIndex + 1, 0, DEV_LAUNCHER_ON_NEW_INTENT);

        content = lines.join('\n');
      }

      if (!content.includes('DevLauncherController.wrapReactActivityDelegate')) {
        content = content.replace(
          /(new ReactActivityDelegate(.*|\s)*});$/m,
          DEV_LAUNCHER_WRAPPED_ACTIVITY_DELEGATE
        );
      }

      config.modResults.contents = content;
    } else {
      WarningAggregator.addWarningAndroid(
        'android-devLauncher',
        `Cannot automatically configure MainActivity if it's not java`
      );
    }

    return config;
  });
};

const withDevLauncherPodfile: ConfigPlugin = config => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      await editPodfile(config, podfile => {
        podfile = podfile.replace("platform :ios, '10.0'", "platform :ios, '11.0'");
        // Match both variations of Ruby config:
        // unknown: pod 'expo-dev-menu', path: '../node_modules/expo-dev-menu', :configurations => :debug
        // Rubocop: pod 'expo-dev-menu', path: '../node_modules/expo-dev-menu', configurations: :debug
        if (
          !podfile.match(
            /pod ['"]expo-dev-menu['"],\s?path: ['"]\.\.\/node_modules\/expo-dev-menu['"],\s?:?configurations:?\s(?:=>\s)?:debug/
          )
        ) {
          podfile = addLines(podfile, 'use_react_native', 0, [`  ${DEV_LAUNCHER_POD_IMPORT}`]);
        }
        return podfile;
      });
      return config;
    },
  ]);
};

const withDevLauncherAppDelegate: ConfigPlugin = config => {
  return withDangerousMod(config, [
    'ios',
    async config => {
      await editAppDelegate(config, appDelegate => {
        if (!appDelegate.includes(DEV_LAUNCHER_APP_DELEGATE_IOS_IMPORT)) {
          const lines = appDelegate.split('\n');
          lines.splice(1, 0, DEV_LAUNCHER_APP_DELEGATE_IOS_IMPORT);

          appDelegate = lines.join('\n');
        }

        if (!appDelegate.includes(DEV_LAUNCHER_APP_DELEGATE_INIT)) {
          appDelegate = appDelegate.replace(
            /(didFinishLaunchingWithOptions([^}])*)\[self initializeReactNativeApp\];(([^}])*})/,
            `$1${DEV_LAUNCHER_APP_DELEGATE_INIT}$3`
          );
        }

        if (!appDelegate.includes(DEV_LAUNCHER_APP_DELEGATE_BRIDGE)) {
          appDelegate = appDelegate.replace(
            'RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:self.launchOptions];',
            DEV_LAUNCHER_APP_DELEGATE_BRIDGE
          );
        }

        if (!appDelegate.includes(DEV_LAUNCHER_APP_DELEGATE_SOURCE_FOR_URL)) {
          appDelegate = appDelegate.replace(
            'return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];',
            DEV_LAUNCHER_APP_DELEGATE_SOURCE_FOR_URL
          );
        }

        if (!appDelegate.includes(DEV_LAUNCHER_APP_DELEGATE_ON_DEEP_LINK)) {
          appDelegate = appDelegate.replace(
            'return [RCTLinkingManager application:application openURL:url options:options];',
            DEV_LAUNCHER_APP_DELEGATE_ON_DEEP_LINK
          );
        }

        if (!appDelegate.includes(DEV_LAUNCHER_APP_DELEGATE_CONTROLLER_DELEGATE)) {
          appDelegate += DEV_LAUNCHER_APP_DELEGATE_CONTROLLER_DELEGATE;
        }

        return appDelegate;
      });

      return config;
    },
  ]);
};
const withDevLauncher = (config: ExpoConfig) => {
  config = withDevLauncherActivity(config);
  config = withDevLauncherApplication(config);
  config = withDevLauncherPodfile(config);
  config = withDevLauncherAppDelegate(config);
  return config;
};

export default withDevLauncher;
