#import "ExpoDevLauncherBridgeDelegateHandler.h"
#import "EXDevLauncherController.h"

#import <React/RCTBundleURLProvider.h>
#import "RCTAppSetupUtils.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import <memory>

#import <React/CoreModulesPlugins.h>
#import <React/RCTFabricSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <react/config/ReactNativeConfig.h>
#import <React/RCTCxxBridgeDelegate.h>


#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>
#import <React-RCTAppDelegate/RCTAppDelegate.h>

static NSString *const kRNConcurrentRoot = @"concurrentRoot";

@interface ExpoDevLauncherBridgeDelegateHandler () <RCTTurboModuleManagerDelegate, RCTCxxBridgeDelegate> {
  std::shared_ptr<const facebook::react::ReactNativeConfig> _reactNativeConfig;
  facebook::react::ContextContainer::Shared _contextContainer;
}
@end

#endif

@implementation ExpoDevLauncherBridgeDelegateHandler

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  return [[EXDevLauncherController sharedInstance] sourceUrl];
}

- (RCTBridge *)createBridgeAndSetAdapterWithLaunchOptions:(NSDictionary * _Nullable)launchOptions {
    self.bridge = [self createBridgeWithDelegate:self launchOptions:launchOptions];

#ifdef RCT_NEW_ARCH_ENABLED
    _contextContainer = std::make_shared<facebook::react::ContextContainer const>();
    _reactNativeConfig = std::make_shared<facebook::react::EmptyReactNativeConfig const>();
    _contextContainer->insert("ReactNativeConfig", _reactNativeConfig);
    self.bridgeAdapter = [[RCTSurfacePresenterBridgeAdapter alloc] initWithBridge:self.bridge
                                                                 contextContainer:_contextContainer];
    self.bridge.surfacePresenter = self.bridgeAdapter.surfacePresenter;
#endif

    return self.bridge;
}

@end
