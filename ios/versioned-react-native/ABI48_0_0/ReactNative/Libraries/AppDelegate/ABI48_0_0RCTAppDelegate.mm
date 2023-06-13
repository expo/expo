/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTAppDelegate.h"
#import <ABI48_0_0React/ABI48_0_0RCTAppSetupUtils.h>
#import <ABI48_0_0React/ABI48_0_0RCTRootView.h>

#if ABI48_0_0RCT_NEW_ARCH_ENABLED
#import <ABI48_0_0React/ABI48_0_0CoreModulesPlugins.h>
#import <ABI48_0_0React/ABI48_0_0RCTCxxBridgeDelegate.h>
#import <ABI48_0_0React/ABI48_0_0RCTFabricSurfaceHostingProxyRootView.h>
#import <ABI48_0_0React/ABI48_0_0RCTSurfacePresenter.h>
#import <ABI48_0_0React/ABI48_0_0RCTSurfacePresenterBridgeAdapter.h>
#import <ABI48_0_0ReactCommon/ABI48_0_0RCTTurboModuleManager.h>
#import <ABI48_0_0React/ABI48_0_0config/ABI48_0_0ReactNativeConfig.h>

static NSString *const kRNConcurrentRoot = @"concurrentRoot";

@interface ABI48_0_0RCTAppDelegate () <ABI48_0_0RCTTurboModuleManagerDelegate, ABI48_0_0RCTCxxBridgeDelegate> {
  std::shared_ptr<const ABI48_0_0facebook::ABI48_0_0React::ABI48_0_0ReactNativeConfig> _ABI48_0_0ReactNativeConfig;
  ABI48_0_0facebook::ABI48_0_0React::ContextContainer::Shared _contextContainer;
}
@end

#endif

@implementation ABI48_0_0RCTAppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  BOOL enableTM = NO;
#if ABI48_0_0RCT_NEW_ARCH_ENABLED
  enableTM = self.turboModuleEnabled;
#endif

  ABI48_0_0RCTAppSetupPrepareApp(application, enableTM);

  if (!self.bridge) {
    self.bridge = [self createBridgeWithDelegate:self launchOptions:launchOptions];
  }
#if ABI48_0_0RCT_NEW_ARCH_ENABLED
  _contextContainer = std::make_shared<ABI48_0_0facebook::ABI48_0_0React::ContextContainer const>();
  _ABI48_0_0ReactNativeConfig = std::make_shared<ABI48_0_0facebook::ABI48_0_0React::EmptyABI48_0_0ReactNativeConfig const>();
  _contextContainer->insert("ABI48_0_0ReactNativeConfig", _ABI48_0_0ReactNativeConfig);
  self.bridgeAdapter = [[ABI48_0_0RCTSurfacePresenterBridgeAdapter alloc] initWithBridge:self.bridge
                                                               contextContainer:_contextContainer];
  self.bridge.surfacePresenter = self.bridgeAdapter.surfacePresenter;
#endif

  NSDictionary *initProps = [self prepareInitialProps];
  UIView *rootView = [self createRootViewWithBridge:self.bridge moduleName:self.moduleName initProps:initProps];

  if (@available(iOS 13.0, *)) {
    rootView.backgroundColor = [UIColor systemBackgroundColor];
  } else {
    rootView.backgroundColor = [UIColor whiteColor];
  }

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [self createRootViewController];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

- (NSURL *)sourceURLForBridge:(ABI48_0_0RCTBridge *)bridge
{
  [NSException raise:@"ABI48_0_0RCTBridgeDelegate::sourceURLForBridge not implemented"
              format:@"Subclasses must implement a valid sourceURLForBridge method"];
  return nil;
}

- (BOOL)concurrentRootEnabled
{
  [NSException raise:@"concurrentRootEnabled not implemented"
              format:@"Subclasses must implement a valid concurrentRootEnabled method"];
  return true;
}

- (NSDictionary *)prepareInitialProps
{
  NSMutableDictionary *initProps = self.initialProps ? [self.initialProps mutableCopy] : [NSMutableDictionary new];

#ifdef ABI48_0_0RCT_NEW_ARCH_ENABLED
  initProps[kRNConcurrentRoot] = @([self concurrentRootEnabled]);
#endif

  return initProps;
}

- (ABI48_0_0RCTBridge *)createBridgeWithDelegate:(id<ABI48_0_0RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  return [[ABI48_0_0RCTBridge alloc] initWithDelegate:delegate launchOptions:launchOptions];
}

- (UIView *)createRootViewWithBridge:(ABI48_0_0RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps
{
  BOOL enableFabric = NO;
#if ABI48_0_0RCT_NEW_ARCH_ENABLED
  enableFabric = self.fabricEnabled;
#endif
  return ABI48_0_0RCTAppSetupDefaultRootView(bridge, moduleName, initProps, enableFabric);
}

- (UIViewController *)createRootViewController
{
  return [UIViewController new];
}

#if ABI48_0_0RCT_NEW_ARCH_ENABLED
#pragma mark - ABI48_0_0RCTCxxBridgeDelegate

- (std::unique_ptr<ABI48_0_0facebook::ABI48_0_0React::JSExecutorFactory>)jsExecutorFactoryForBridge:(ABI48_0_0RCTBridge *)bridge
{
  self.turboModuleManager = [[ABI48_0_0RCTTurboModuleManager alloc] initWithBridge:bridge
                                                                 delegate:self
                                                                jsInvoker:bridge.jsCallInvoker];
  return ABI48_0_0RCTAppSetupDefaultJsExecutorFactory(bridge, _turboModuleManager);
}

#pragma mark ABI48_0_0RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
  return ABI48_0_0RCTCoreModulesClassProvider(name);
}

- (std::shared_ptr<ABI48_0_0facebook::ABI48_0_0React::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<ABI48_0_0facebook::ABI48_0_0React::CallInvoker>)jsInvoker
{
  return nullptr;
}

- (std::shared_ptr<ABI48_0_0facebook::ABI48_0_0React::TurboModule>)getTurboModule:(const std::string &)name
                                                     initParams:
                                                         (const ABI48_0_0facebook::ABI48_0_0React::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

- (id<ABI48_0_0RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return ABI48_0_0RCTAppSetupDefaultModuleFromClass(moduleClass);
}

#pragma mark - New Arch Enabled settings

- (BOOL)turboModuleEnabled
{
  return YES;
}

- (BOOL)fabricEnabled
{
  return YES;
}

#endif

@end
