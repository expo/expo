/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTAppDelegate.h"
#import <ABI49_0_0React/ABI49_0_0RCTCxxBridgeDelegate.h>
#import <ABI49_0_0React/ABI49_0_0RCTRootView.h>
#import <ABI49_0_0React/ABI49_0_0RCTRuntimeExecutorFromBridge.h>
#import <ABI49_0_0React/renderer/runtimescheduler/ABI49_0_0RuntimeScheduler.h>

#import "ABI49_0_0RCTAppSetupUtils.h"

#if ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0CoreModulesPlugins.h>
#import <ABI49_0_0React/ABI49_0_0RCTComponentViewFactory.h>
#import <ABI49_0_0React/ABI49_0_0RCTComponentViewProtocol.h>
#import <ABI49_0_0React/ABI49_0_0RCTFabricSurfaceHostingProxyRootView.h>
#import <ABI49_0_0React/ABI49_0_0RCTLegacyViewManagerInteropComponentView.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfacePresenter.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfacePresenterBridgeAdapter.h>
#import <ABI49_0_0ReactCommon/ABI49_0_0RCTTurboModuleManager.h>
#import <ABI49_0_0React/ABI49_0_0config/ABI49_0_0ReactNativeConfig.h>
#import <ABI49_0_0React/renderer/runtimescheduler/ABI49_0_0RuntimeSchedulerCallInvoker.h>
#import "ABI49_0_0RCTLegacyInteropComponents.h"

static NSString *const kRNConcurrentRoot = @"concurrentRoot";

@interface ABI49_0_0RCTAppDelegate () <ABI49_0_0RCTTurboModuleManagerDelegate> {
  std::shared_ptr<const ABI49_0_0facebook::ABI49_0_0React::ABI49_0_0ReactNativeConfig> _ABI49_0_0ReactNativeConfig;
  ABI49_0_0facebook::ABI49_0_0React::ContextContainer::Shared _contextContainer;
}
@end

#endif

@interface ABI49_0_0RCTAppDelegate () <ABI49_0_0RCTCxxBridgeDelegate> {
  std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::RuntimeScheduler> _runtimeScheduler;
}
@end

@implementation ABI49_0_0RCTAppDelegate

#if ABI49_0_0RCT_NEW_ARCH_ENABLED
- (instancetype)init
{
  if (self = [super init]) {
    _contextContainer = std::make_shared<ABI49_0_0facebook::ABI49_0_0React::ContextContainer const>();
    _ABI49_0_0ReactNativeConfig = std::make_shared<ABI49_0_0facebook::ABI49_0_0React::EmptyABI49_0_0ReactNativeConfig const>();
    _contextContainer->insert("ABI49_0_0ReactNativeConfig", _ABI49_0_0ReactNativeConfig);
  }
  return self;
}
#endif

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  BOOL enableTM = NO;
#if ABI49_0_0RCT_NEW_ARCH_ENABLED
  enableTM = self.turboModuleEnabled;
#endif
  ABI49_0_0RCTAppSetupPrepareApp(application, enableTM);

  if (!self.bridge) {
    self.bridge = [self createBridgeWithDelegate:self launchOptions:launchOptions];
  }
#if ABI49_0_0RCT_NEW_ARCH_ENABLED
  self.bridgeAdapter = [[ABI49_0_0RCTSurfacePresenterBridgeAdapter alloc] initWithBridge:self.bridge
                                                               contextContainer:_contextContainer];
  self.bridge.surfacePresenter = self.bridgeAdapter.surfacePresenter;

  [self unstable_registerLegacyComponents];
#endif

  NSDictionary *initProps = [self prepareInitialProps];
  UIView *rootView = [self createRootViewWithBridge:self.bridge moduleName:self.moduleName initProps:initProps];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [self createRootViewController];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  return YES;
}

- (NSURL *)sourceURLForBridge:(ABI49_0_0RCTBridge *)bridge
{
  [NSException raise:@"ABI49_0_0RCTBridgeDelegate::sourceURLForBridge not implemented"
              format:@"Subclasses must implement a valid sourceURLForBridge method"];
  return nil;
}

- (NSDictionary *)prepareInitialProps
{
  NSMutableDictionary *initProps = self.initialProps ? [self.initialProps mutableCopy] : [NSMutableDictionary new];

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
  // Hardcoding the Concurrent Root as it it not recommended to
  // have the concurrentRoot turned off when Fabric is enabled.
  initProps[kRNConcurrentRoot] = @([self fabricEnabled]);
#endif

  return initProps;
}

- (ABI49_0_0RCTBridge *)createBridgeWithDelegate:(id<ABI49_0_0RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  return [[ABI49_0_0RCTBridge alloc] initWithDelegate:delegate launchOptions:launchOptions];
}

- (UIView *)createRootViewWithBridge:(ABI49_0_0RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps
{
  BOOL enableFabric = NO;
#if ABI49_0_0RCT_NEW_ARCH_ENABLED
  enableFabric = self.fabricEnabled;
#endif
  UIView *rootView = ABI49_0_0RCTAppSetupDefaultRootView(bridge, moduleName, initProps, enableFabric);
  if (@available(iOS 13.0, *)) {
    rootView.backgroundColor = [UIColor systemBackgroundColor];
  } else {
    rootView.backgroundColor = [UIColor whiteColor];
  }

  return rootView;
}

- (UIViewController *)createRootViewController
{
  return [UIViewController new];
}

- (BOOL)runtimeSchedulerEnabled
{
  return YES;
}

#pragma mark - ABI49_0_0RCTCxxBridgeDelegate
- (std::unique_ptr<ABI49_0_0facebook::ABI49_0_0React::JSExecutorFactory>)jsExecutorFactoryForBridge:(ABI49_0_0RCTBridge *)bridge
{
#if ABI49_0_0RCT_NEW_ARCH_ENABLED
  _runtimeScheduler = std::make_shared<ABI49_0_0facebook::ABI49_0_0React::RuntimeScheduler>(ABI49_0_0RCTRuntimeExecutorFromBridge(bridge));
  std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::CallInvoker> callInvoker =
      std::make_shared<ABI49_0_0facebook::ABI49_0_0React::RuntimeSchedulerCallInvoker>(_runtimeScheduler);
  self.turboModuleManager = [[ABI49_0_0RCTTurboModuleManager alloc] initWithBridge:bridge delegate:self jsInvoker:callInvoker];
  _contextContainer->erase("RuntimeScheduler");
  _contextContainer->insert("RuntimeScheduler", _runtimeScheduler);
  return ABI49_0_0RCTAppSetupDefaultJsExecutorFactory(bridge, self.turboModuleManager, _runtimeScheduler);
#else
  if (self.runtimeSchedulerEnabled) {
    _runtimeScheduler = std::make_shared<ABI49_0_0facebook::ABI49_0_0React::RuntimeScheduler>(ABI49_0_0RCTRuntimeExecutorFromBridge(bridge));
  }
  return ABI49_0_0RCTAppSetupJsExecutorFactoryForOldArch(bridge, _runtimeScheduler);
#endif
}


#if ABI49_0_0RCT_NEW_ARCH_ENABLED

#pragma mark - ABI49_0_0RCTTurboModuleManagerDelegate

- (Class)getModuleClassFromName:(const char *)name
{
  return ABI49_0_0RCTCoreModulesClassProvider(name);
}

- (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::CallInvoker>)jsInvoker
{
  return nullptr;
}

- (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule>)getTurboModule:(const std::string &)name
                                                     initParams:
                                                         (const ABI49_0_0facebook::ABI49_0_0React::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

- (id<ABI49_0_0RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return ABI49_0_0RCTAppSetupDefaultModuleFromClass(moduleClass);
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

#pragma mark - New Arch Utilities

- (void)unstable_registerLegacyComponents
{
  for (NSString *legacyComponent in [ABI49_0_0RCTLegacyInteropComponents legacyInteropComponents]) {
    [ABI49_0_0RCTLegacyViewManagerInteropComponentView supportLegacyViewManagerWithName:legacyComponent];
  }
}

#endif

@end
