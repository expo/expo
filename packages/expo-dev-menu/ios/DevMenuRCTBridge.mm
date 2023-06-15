// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXDevMenu/DevMenuRCTBridge.h>

// The search path for the Swift generated headers are different
// between use_frameworks and non_use_frameworks mode.
#if __has_include(<EXDevMenuInterface/EXDevMenuInterface-Swift.h>)
#import <EXDevMenuInterface/EXDevMenuInterface-Swift.h>
#else
#import <EXDevMenuInterface-Swift.h>
#endif
#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
#import <ExpoModulesCore/ExpoModulesCore-Swift.h>
#else
#import <ExpoModulesCore-Swift.h>
#endif
#if __has_include(<EXDevMenu/EXDevMenu-Swift.h>)
#import <EXDevMenu/EXDevMenu-Swift.h>
#else
#import <EXDevMenu-Swift.h>
#endif
#import <RCTCxxBridge+Private.h>

#import <React/RCTPerformanceLogger.h>
#import <React/RCTDevSettings.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTDevMenu.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTJSIExecutorRuntimeInstaller.h>
#import <React/RCTRuntimeExecutorFromBridge.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#if __has_include(<reacthermes/HermesExecutorFactory.h>)
#import <reacthermes/HermesExecutorFactory.h>
#endif

#import "RCTAppSetupUtils.h"

#if RCT_NEW_ARCH_ENABLED
#import <React/CoreModulesPlugins.h>
#import <React/RCTComponentViewFactory.h>
#import <React/RCTComponentViewProtocol.h>
#import <React/RCTFabricSurfaceHostingProxyRootView.h>
#import <React/RCTLegacyViewManagerInteropComponentView.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <react/config/ReactNativeConfig.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>
#import "RCTLegacyInteropComponents.h"

@interface DevMenuRCTAppDelegate () <RCTTurboModuleManagerDelegate> {
  std::shared_ptr<const facebook::react::ReactNativeConfig> _reactNativeConfig;
  facebook::react::ContextContainer::Shared _contextContainer;
}
@end

#endif

@implementation DevMenuRCTCxxBridge

- (instancetype)initWithParentBridge:(RCTBridge *)bridge
{
  if ((self = [super initWithParentBridge:bridge])) {
    RCTBridge *appBridge = DevMenuManager.shared.currentBridge;
    // reset the singleton `RCTBridge.currentBridge` to app bridge instance
    RCTBridge.currentBridge = appBridge != nil ? appBridge.batchedBridge : nil;
  }
  return self;
}

/**
 * Theoretically, we could overwrite the `RCTDevSettings` module by exporting our version through the bridge.
 * However, this won't work with the js remote debugging. For some reason, the RN needs to initialized remote tools very early. So it always uses the default module to do it.
 * When we export our module, it won't be used in the initialized phase. So the dev-menu will start with remote debug support.
 */
- (RCTDevSettings *)devSettings
{
  // uncomment below to enable fast refresh for development builds of DevMenu
  //  return super.devSettings;
  return nil;
}

- (RCTDevMenu *)devMenu
{
  return nil;
}

- (NSArray<Class> *)filterModuleList:(NSArray<Class> *)modules
{
  NSArray<NSString *> *allowedModules = @[@"RCT", @"ExpoBridgeModule", @"EXNativeModulesProxy", @"EXReactNativeEventEmitter"];
  NSArray<Class> *filteredModuleList = [modules filteredArrayUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(id  _Nullable clazz, NSDictionary<NSString *,id> * _Nullable bindings) {
    NSString* clazzName = NSStringFromClass(clazz);

    if ([clazz conformsToProtocol:@protocol(EXDevExtensionProtocol)]) {
      return true;
    }

    for (NSString *allowedModule in allowedModules) {
      if ([clazzName hasPrefix:allowedModule]) {
        return true;
      }
    }
    return false;
  }]];

  return filteredModuleList;
}

- (NSArray<RCTModuleData *> *)_initializeModules:(NSArray<Class> *)modules
                               withDispatchGroup:(dispatch_group_t)dispatchGroup
                                lazilyDiscovered:(BOOL)lazilyDiscovered
{
  NSArray<Class> *filteredModuleList = [self filterModuleList: modules];
  return [super _initializeModules:filteredModuleList withDispatchGroup:dispatchGroup lazilyDiscovered:lazilyDiscovered];
}

@end

@implementation DevMenuRCTBridge

- (Class)bridgeClass
{
  return [DevMenuRCTCxxBridge class];
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-implementations"
// This method is still used so we need to override it even if it's deprecated
- (void)reloadWithReason:(NSString *)reason {}
#pragma clang diagnostic pop

@end

@interface DevMenuRCTAppDelegate () <RCTCxxBridgeDelegate> {
  std::shared_ptr<facebook::react::RuntimeScheduler> _runtimeScheduler;
}
@end

@interface RCTAppDelegate (DevMenuRCTAppDelegate)

#ifdef __cplusplus
- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge;
#endif
@end

@implementation DevMenuRCTAppDelegate


- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  return [[DevMenuRCTBridge alloc] initWithDelegate:delegate launchOptions:launchOptions];
}

- (void)createBridgeWithAdapter:(NSDictionary * _Nullable)launchOptions {
    self.bridge = [self createBridgeWithDelegate:self launchOptions:launchOptions];

#ifdef RCT_NEW_ARCH_ENABLED
    _contextContainer = std::make_shared<facebook::react::ContextContainer const>();
    _reactNativeConfig = std::make_shared<facebook::react::EmptyReactNativeConfig const>();
    _contextContainer->insert("ReactNativeConfig", _reactNativeConfig);
    self.bridgeAdapter = [[RCTSurfacePresenterBridgeAdapter alloc] initWithBridge:self.bridge
                                                                 contextContainer:_contextContainer];
    self.bridge.surfacePresenter = self.bridgeAdapter.surfacePresenter;
#endif
}

#pragma mark - RCTCxxBridgeDelegate
- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
    std::unique_ptr<facebook::react::JSExecutorFactory> executorFactory  = [super jsExecutorFactoryForBridge:bridge];

    #if __has_include(<reacthermes/HermesExecutorFactory.h>)
        auto rawExecutorFactory = executorFactory.get();
        auto hermesExecFactory = dynamic_cast<facebook::react::HermesExecutorFactory*>(rawExecutorFactory);
        if (hermesExecFactory != nullptr) {
            hermesExecFactory->setEnableDebugger(false);
        }
    #endif

    return executorFactory;
}

@end
