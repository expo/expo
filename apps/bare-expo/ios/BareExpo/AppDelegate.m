/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "AppDelegate.h"

#import <React/RCTLinkingManager.h>

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

#import <UMCore/UMModuleRegistry.h>
#import <UMReactNativeAdapter/UMNativeModulesProxy.h>
#import <UMReactNativeAdapter/UMModuleRegistryAdapter.h>

@implementation AppDelegate

@synthesize window = _window;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  NSString * appName = [[[NSProcessInfo processInfo] environment] objectForKey:@"APP_NAME"];
  if (appName == nil) {
    appName = @"BareExpo";
  }
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:appName initialProperties:nil];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  [super application:application didFinishLaunchingWithOptions:launchOptions];

  return YES;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  NSArray<id<RCTBridgeModule>> *extraModules = [_moduleRegistryAdapter extraModulesForBridge:bridge];
  // You can inject any extra modules that you would like here, more information at:
  // https://facebook.github.io/react-native/docs/native-modules-ios.html#dependency-injection
  return extraModules;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
#ifdef DEBUG
  NSString *jsBundleURLForBundleRoot = [[[NSProcessInfo processInfo] environment] objectForKey:@"BUNDLE_URL"];
  if (jsBundleURLForBundleRoot == nil) {
    jsBundleURLForBundleRoot = @"index";
  }
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:jsBundleURLForBundleRoot fallbackResource:nil];
#else
  NSString *jsBundlePath = [[[NSProcessInfo processInfo] environment] objectForKey:@"BUNDLE_PATH"];
  if (jsBundlePath == nil) {
    jsBundlePath = @"main";
  }
  return [[NSBundle mainBundle] URLForResource:jsBundlePath withExtension:@"jsbundle"];
#endif
}

#if RCT_DEV
- (BOOL)bridge:(RCTBridge *)bridge didNotFindModule:(NSString *)moduleName {
  return YES;
}
#endif


- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:app openURL:url options:options];
}

@end
