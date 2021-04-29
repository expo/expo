import { ConfigPlugin, WarningAggregator, withAppDelegate } from '@expo/config-plugins';

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

export function modifyAppDelegate(appDelegate: string) {
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
}

export const withDevLauncherAppDelegate: ConfigPlugin = config => {
  return withAppDelegate(config, config => {
    if (config.modResults.language === 'objc') {
      config.modResults.contents = modifyAppDelegate(config.modResults.contents);
    } else {
      WarningAggregator.addWarningIOS(
        'expo-dev-launcher',
        'Swift AppDelegate files are not supported yet.'
      );
    }
    return config;
  });
};
