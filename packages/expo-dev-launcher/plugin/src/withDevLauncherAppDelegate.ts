import { ConfigPlugin, WarningAggregator, withAppDelegate } from 'expo/config-plugins';
import semver from 'semver';

import { InstallationPage } from './constants';
import { resolveExpoUpdatesVersion } from './resolveExpoUpdatesVersion';
import { addLines } from './utils';

function escapeRegExpCharacters(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const INITIALIZE_REACT_NATIVE_APP_FUNCTION = `- (RCTBridge *)initializeReactNativeApp`;
const NEW_INITIALIZE_REACT_NATIVE_APP_FUNCTION = `- (RCTBridge *)initializeReactNativeApp:(NSDictionary *)launchOptions`;

const DEV_LAUNCHER_APP_DELEGATE_SOURCE_FOR_URL = `  #if defined(EX_DEV_LAUNCHER_ENABLED)
  return [[EXDevLauncherController sharedInstance] sourceUrl];
  #else
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
  #endif`;
const DEV_LAUNCHER_APP_DELEGATE_ON_DEEP_LINK_TO_REMOVE = new RegExp(
  'return (' +
    escapeRegExpCharacters('[super application:application openURL:url options:options] || ') +
    ')?' +
    escapeRegExpCharacters(
      '[RCTLinkingManager application:application openURL:url options:options];'
    )
);
const DEV_LAUNCHER_APP_DELEGATE_ON_DEEP_LINK = `#if defined(EX_DEV_LAUNCHER_ENABLED)
  if ([EXDevLauncherController.sharedInstance onDeepLink:url options:options]) {
    return true;
  }
  #endif
  $&`;
const DEV_LAUNCHER_APP_DELEGATE_IOS_IMPORT = `
#if defined(EX_DEV_LAUNCHER_ENABLED)
#include <EXDevLauncher/EXDevLauncherController.h>
#endif`;
const DEV_LAUNCHER_UPDATES_APP_DELEGATE_IOS_IMPORT = `
#if defined(EX_DEV_LAUNCHER_ENABLED)
#include <EXDevLauncher/EXDevLauncherController.h>
#import <EXUpdates/EXUpdatesDevLauncherController.h>
#endif`;
const DEV_LAUNCHER_APP_DELEGATE_CONTROLLER_DELEGATE_LEGACY = `
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

const DEV_LAUNCHER_APP_DELEGATE_CONTROLLER_DELEGATE = `
#if defined(EX_DEV_LAUNCHER_ENABLED)
@implementation AppDelegate (EXDevLauncherControllerDelegate)

- (void)devLauncherController:(EXDevLauncherController *)developmentClientController
    didStartWithSuccess:(BOOL)success
{
  developmentClientController.appBridge = [self initializeReactNativeApp:[EXDevLauncherController.sharedInstance getLaunchOptions]];
}

@end
#endif
`;

const DEV_LAUNCHER_APP_DELEGATE_INIT = `#if defined(EX_DEV_LAUNCHER_ENABLED)
        EXDevLauncherController *controller = [EXDevLauncherController sharedInstance];
        [controller startWithWindow:self.window delegate:(id<EXDevLauncherControllerDelegate>)self launchOptions:launchOptions];
      #else
        [self initializeReactNativeApp];
      #endif`;
const DEV_LAUNCHER_UPDATES_APP_DELEGATE_INIT = `EXDevLauncherController *controller = [EXDevLauncherController sharedInstance];
        controller.updatesInterface = [EXUpdatesDevLauncherController sharedInstance];`;

const DEV_LAUNCHER_APP_DELEGATE_BRIDGE = `#if defined(EX_DEV_LAUNCHER_ENABLED)
    NSDictionary *launchOptions = [EXDevLauncherController.sharedInstance getLaunchOptions];
  #else
    NSDictionary *launchOptions = self.launchOptions;
  #endif
  
    RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];`;

const DEV_MENU_IMPORT = `@import EXDevMenu;`;
const DEV_MENU_IOS_INIT = `
#if defined(EX_DEV_MENU_ENABLED)
  [DevMenuManager configureWithBridge:bridge];
#endif`;

const DEV_LAUNCHER_INIT_TO_REMOVE = new RegExp(
  escapeRegExpCharacters(`RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"main" initialProperties:nil];
  id rootViewBackgroundColor = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"RCTRootViewBackgroundColor"];
  if (rootViewBackgroundColor != nil) {
    rootView.backgroundColor = [RCTConvert UIColor:rootViewBackgroundColor];
  } else {
    rootView.backgroundColor = [UIColor whiteColor];
  }

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = `) +
    `([^;]+)` +
    escapeRegExpCharacters(`;
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];`),
  'm'
);

const DEV_LAUNCHER_INIT_TO_REMOVE_SDK_44 = new RegExp(
  escapeRegExpCharacters(`RCTBridge *bridge = [self.reactDelegate createBridgeWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [self.reactDelegate createRootViewWithBridge:bridge moduleName:@"main" initialProperties:nil];
  rootView.backgroundColor = [UIColor whiteColor];
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = `) +
    `([^;]+)` +
    escapeRegExpCharacters(`;
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];`),
  'm'
);

const DEV_LAUNCHER_NEW_INIT = `self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
#if defined(EX_DEV_LAUNCHER_ENABLED)
  EXDevLauncherController *controller = [EXDevLauncherController sharedInstance];
  [controller startWithWindow:self.window delegate:(id<EXDevLauncherControllerDelegate>)self launchOptions:launchOptions];
#else
  [self initializeReactNativeApp:launchOptions];
#endif`;

const DEV_LAUNCHER_INITIALIZE_REACT_NATIVE_APP_FUNCTION_DEFINITION_REGEX = new RegExp(
  escapeRegExpCharacters(`
- (RCTBridge *)initializeReactNativeApp:(NSDictionary *)launchOptions
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"main" initialProperties:nil];
  id rootViewBackgroundColor = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"RCTRootViewBackgroundColor"];
  if (rootViewBackgroundColor != nil) {
    rootView.backgroundColor = [RCTConvert UIColor:rootViewBackgroundColor];
  } else {
    rootView.backgroundColor = [UIColor whiteColor];
  }

  UIViewController *rootViewController = `) +
    `[^;]+` +
    escapeRegExpCharacters(`;
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  return bridge;
}
`),
  'm'
);

const DEV_LAUNCHER_INITIALIZE_REACT_NATIVE_APP_FUNCTION_DEFINITION = (
  viewControllerInit: string | undefined
) => `
- (RCTBridge *)initializeReactNativeApp:(NSDictionary *)launchOptions
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"main" initialProperties:nil];
  id rootViewBackgroundColor = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"RCTRootViewBackgroundColor"];
  if (rootViewBackgroundColor != nil) {
    rootView.backgroundColor = [RCTConvert UIColor:rootViewBackgroundColor];
  } else {
    rootView.backgroundColor = [UIColor whiteColor];
  }

  UIViewController *rootViewController = ${viewControllerInit ?? '[UIViewController new]'};
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  return bridge;
}
`;

const DEV_LAUNCHER_INITIALIZE_REACT_NATIVE_APP_FUNCTION_DEFINITION_SDK_44 = `
- (RCTBridge *)initializeReactNativeApp:(NSDictionary *)launchOptions
{
  RCTBridge *bridge = [self.reactDelegate createBridgeWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [self.reactDelegate createRootViewWithBridge:bridge moduleName:@"main" initialProperties:nil];
  rootView.backgroundColor = [UIColor whiteColor];
  UIViewController *rootViewController = [self.reactDelegate createRootViewController];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  return bridge;
 }
`;

function addImports(appDelegate: string, shouldAddUpdatesIntegration: boolean): string {
  if (
    !appDelegate.includes(DEV_LAUNCHER_APP_DELEGATE_IOS_IMPORT) &&
    !appDelegate.includes(DEV_LAUNCHER_UPDATES_APP_DELEGATE_IOS_IMPORT)
  ) {
    const lines = appDelegate.split('\n');
    lines.splice(
      1,
      0,
      shouldAddUpdatesIntegration
        ? DEV_LAUNCHER_UPDATES_APP_DELEGATE_IOS_IMPORT
        : DEV_LAUNCHER_APP_DELEGATE_IOS_IMPORT
    );

    appDelegate = lines.join('\n');
  }

  return appDelegate;
}

function removeDevMenuInit(appDelegate: string): string {
  if (!appDelegate.includes(DEV_MENU_IMPORT)) {
    // expo-dev-launcher is responsible for initializing the expo-dev-menu.
    // We need to remove init block from AppDelegate.
    appDelegate = appDelegate.replace(DEV_MENU_IOS_INIT, '');
  }
  return appDelegate;
}

function addDeepLinkHandler(appDelegate: string): string {
  if (!appDelegate.includes(DEV_LAUNCHER_APP_DELEGATE_ON_DEEP_LINK)) {
    appDelegate = appDelegate.replace(
      DEV_LAUNCHER_APP_DELEGATE_ON_DEEP_LINK_TO_REMOVE,
      DEV_LAUNCHER_APP_DELEGATE_ON_DEEP_LINK
    );
  }
  return appDelegate;
}

function changeDebugURL(appDelegate: string): string {
  if (!appDelegate.includes(DEV_LAUNCHER_APP_DELEGATE_SOURCE_FOR_URL)) {
    appDelegate = appDelegate.replace(
      'return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];',
      DEV_LAUNCHER_APP_DELEGATE_SOURCE_FOR_URL
    );
  }
  return appDelegate;
}

export function modifyLegacyAppDelegate(
  appDelegate: string,
  expoUpdatesVersion: string | null = null
) {
  const shouldAddUpdatesIntegration =
    expoUpdatesVersion != null && semver.gt(expoUpdatesVersion, '0.6.0');

  appDelegate = addImports(appDelegate, shouldAddUpdatesIntegration);

  if (!appDelegate.includes(DEV_LAUNCHER_APP_DELEGATE_INIT)) {
    appDelegate = appDelegate.replace(
      /(didFinishLaunchingWithOptions([^}])*)\[self initializeReactNativeApp\];(([^}])*})/,
      `$1${DEV_LAUNCHER_APP_DELEGATE_INIT}$3`
    );
  }

  if (
    shouldAddUpdatesIntegration &&
    !appDelegate.includes(DEV_LAUNCHER_UPDATES_APP_DELEGATE_INIT)
  ) {
    appDelegate = appDelegate.replace(
      'EXDevLauncherController *controller = [EXDevLauncherController sharedInstance];',
      DEV_LAUNCHER_UPDATES_APP_DELEGATE_INIT
    );
  }

  if (!appDelegate.includes(DEV_LAUNCHER_APP_DELEGATE_BRIDGE)) {
    appDelegate = appDelegate.replace(
      'RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:self.launchOptions];',
      DEV_LAUNCHER_APP_DELEGATE_BRIDGE
    );
  }

  appDelegate = changeDebugURL(appDelegate);
  appDelegate = addDeepLinkHandler(appDelegate);

  if (!appDelegate.includes(DEV_LAUNCHER_APP_DELEGATE_CONTROLLER_DELEGATE_LEGACY)) {
    appDelegate += DEV_LAUNCHER_APP_DELEGATE_CONTROLLER_DELEGATE_LEGACY;
  }

  appDelegate = removeDevMenuInit(appDelegate);
  return appDelegate;
}

export function modifyAppDelegate(appDelegate: string, expoUpdatesVersion: string | null = null) {
  const shouldAddUpdatesIntegration =
    expoUpdatesVersion != null && semver.gt(expoUpdatesVersion, '0.6.0');

  if (
    !DEV_LAUNCHER_INITIALIZE_REACT_NATIVE_APP_FUNCTION_DEFINITION_REGEX.test(appDelegate) &&
    !appDelegate.includes(DEV_LAUNCHER_INITIALIZE_REACT_NATIVE_APP_FUNCTION_DEFINITION_SDK_44)
  ) {
    let initToRemove;
    let shouldAddSDK44Init = false;
    if (DEV_LAUNCHER_INIT_TO_REMOVE_SDK_44.test(appDelegate)) {
      initToRemove = DEV_LAUNCHER_INIT_TO_REMOVE_SDK_44;
      shouldAddSDK44Init = true;
    } else if (DEV_LAUNCHER_INIT_TO_REMOVE.test(appDelegate)) {
      initToRemove = DEV_LAUNCHER_INIT_TO_REMOVE;
    }

    if (initToRemove) {
      // UIViewController can be initialized differently depending on whether expo-screen-orientation is installed,
      // so we need to preserve whatever is there already.
      let viewControllerInit;
      appDelegate = appDelegate.replace(initToRemove, (match, p1) => {
        viewControllerInit = p1;
        return DEV_LAUNCHER_NEW_INIT;
      });
      const initToAdd = shouldAddSDK44Init
        ? DEV_LAUNCHER_INITIALIZE_REACT_NATIVE_APP_FUNCTION_DEFINITION_SDK_44
        : DEV_LAUNCHER_INITIALIZE_REACT_NATIVE_APP_FUNCTION_DEFINITION(viewControllerInit);
      appDelegate = addLines(appDelegate, '@implementation AppDelegate', 1, [initToAdd]);
    } else {
      WarningAggregator.addWarningIOS(
        'expo-dev-launcher',
        `Failed to modify AppDelegate init function. 
See the expo-dev-client installation instructions to modify your AppDelegate manually: ${InstallationPage}`
      );
    }
  }

  if (
    shouldAddUpdatesIntegration &&
    !appDelegate.includes(DEV_LAUNCHER_UPDATES_APP_DELEGATE_INIT)
  ) {
    appDelegate = appDelegate.replace(
      'EXDevLauncherController *controller = [EXDevLauncherController sharedInstance];',
      DEV_LAUNCHER_UPDATES_APP_DELEGATE_INIT
    );
  }

  appDelegate = addImports(appDelegate, shouldAddUpdatesIntegration);

  if (!appDelegate.includes(DEV_LAUNCHER_APP_DELEGATE_CONTROLLER_DELEGATE)) {
    appDelegate += DEV_LAUNCHER_APP_DELEGATE_CONTROLLER_DELEGATE;
  }

  appDelegate = addDeepLinkHandler(appDelegate);
  appDelegate = changeDebugURL(appDelegate);
  appDelegate = removeDevMenuInit(appDelegate);
  return appDelegate;
}

export const withDevLauncherAppDelegate: ConfigPlugin = (config) => {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language === 'objc') {
      let expoUpdatesVersion;
      try {
        expoUpdatesVersion = resolveExpoUpdatesVersion(config.modRequest.projectRoot);
      } catch (e) {
        WarningAggregator.addWarningIOS(
          'expo-dev-launcher',
          `Failed to check compatibility with expo-updates - ${e}`
        );
      }

      if (
        config.modResults.contents.includes(INITIALIZE_REACT_NATIVE_APP_FUNCTION) &&
        !config.modResults.contents.includes(NEW_INITIALIZE_REACT_NATIVE_APP_FUNCTION)
      ) {
        config.modResults.contents = modifyLegacyAppDelegate(
          config.modResults.contents,
          expoUpdatesVersion
        );
      } else {
        config.modResults.contents = modifyAppDelegate(
          config.modResults.contents,
          expoUpdatesVersion
        );
      }
    } else {
      WarningAggregator.addWarningIOS(
        'expo-dev-launcher',
        `Swift AppDelegate files are not supported yet.
See the expo-dev-client installation instructions to modify your AppDelegate manually: ${InstallationPage}`
      );
    }
    return config;
  });
};
