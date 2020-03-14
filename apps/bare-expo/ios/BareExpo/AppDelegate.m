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
#import <React/RCTUtils.h>
#import <React/RCTDevMenu.h>

#import <UMCore/UMModuleRegistry.h>
#import <UMReactNativeAdapter/UMNativeModulesProxy.h>
#import <UMReactNativeAdapter/UMModuleRegistryAdapter.h>

@implementation AppDelegate

@synthesize window = _window;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [self ensureReactMethodSwizzlingSetUp];

  self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"BareExpo" initialProperties:nil];
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
  NSMutableArray<id<RCTBridgeModule>> *extraModules = [NSMutableArray arrayWithArray:[_moduleRegistryAdapter extraModulesForBridge:bridge]];
  // You can inject any extra modules that you would like here, more information at:
  // https://facebook.github.io/react-native/docs/native-modules-ios.html#dependency-injection

  // RCTDevMenu was removed when integrating React with Expo client:
  // https://github.com/expo/react-native/commit/7f2912e8005ea6e81c45935241081153b822b988
  // Let's bring it back in Bare Expo.
  [extraModules addObject:(id<RCTBridgeModule>)[[RCTDevMenu alloc] init]];
  return extraModules;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
#ifdef DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
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

// Bring back React method swizzling removed from its Pod
// when integrating with Expo client.
// https://github.com/expo/react-native/commit/7f2912e8005ea6e81c45935241081153b822b988
- (void)ensureReactMethodSwizzlingSetUp
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    #pragma clang diagnostic push
    #pragma clang diagnostic ignored "-Wundeclared-selector"
    // RCTKeyCommands.m
    // swizzle UIResponder
    RCTSwapInstanceMethods([UIResponder class],
                          @selector(keyCommands),
                          @selector(RCT_keyCommands));

    // RCTDevMenu.m
    // We're swizzling here because it's poor form to override methods in a category,
    // however UIWindow doesn't actually implement motionEnded:withEvent:, so there's
    // no need to call the original implementation.
    RCTSwapInstanceMethods([UIWindow class], @selector(motionEnded:withEvent:), @selector(RCT_motionEnded:withEvent:));
    #pragma clang diagnostic pop
  });
}

@end
