#import <React/RCTRootView.h>

#import "EXDevLauncherBridgeDelegate.h"

#import "EXDevLauncherController.h"
#import "EXDevLauncherRCTBridge.h"

#if RCT_NEW_ARCH_ENABLED
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

#endif

#import "React/RCTAppSetupUtils.h"

@interface EXDevLauncherBridgeDelegate () <RCTTurboModuleManagerDelegate, RCTCxxBridgeDelegate, RCTBridgeDelegate> {
  RCTSurfacePresenterBridgeAdapter *_bridgeAdapter;
  std::shared_ptr<const facebook::react::ReactNativeConfig> _reactNativeConfig;
  facebook::react::ContextContainer::Shared _contextContainer;
  RCTTurboModuleManager *turboModuleManager;
}
@end

@implementation EXDevLauncherBridgeDelegate

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  return [[EXDevLauncherController sharedInstance] sourceURLForBridge:bridge];
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge {
  return [[EXDevLauncherController sharedInstance] extraModulesForBridge:bridge];
}

- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  turboModuleManager = [[RCTTurboModuleManager alloc] initWithBridge:bridge
                                                                 delegate:self
                                                                jsInvoker:bridge.jsCallInvoker];
  return RCTAppSetupDefaultJsExecutorFactory(bridge, turboModuleManager);
}

- (Class)getModuleClassFromName:(const char *)name
{
  return RCTCoreModulesClassProvider(name);
}


- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  return RCTAppSetupDefaultModuleFromClass(moduleClass);
}

- (BOOL)turboModuleEnabled
{
  return YES;
}

- (BOOL)fabricEnabled
{
  return YES;
}

- (RCTRootView *)createRootViewWithModuleName:(NSString *)moduleName launchOptions:(NSDictionary * _Nullable)launchOptions application:(UIApplication *)application{
    BOOL enableTM = NO;
    #if RCT_NEW_ARCH_ENABLED
        enableTM = YES;
    #endif

    RCTAppSetupPrepareApp(application, enableTM);

    RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];

    #if RCT_NEW_ARCH_ENABLED

    _contextContainer = std::make_shared<facebook::react::ContextContainer const>();
    _reactNativeConfig = std::make_shared<facebook::react::EmptyReactNativeConfig const>();
    _contextContainer->insert("ReactNativeConfig", _reactNativeConfig);

    _bridgeAdapter = [[RCTSurfacePresenterBridgeAdapter alloc] initWithBridge:bridge
                                                                contextContainer:_contextContainer];
    bridge.surfacePresenter = _bridgeAdapter.surfacePresenter;
    #endif

    NSMutableDictionary *initProps = [NSMutableDictionary new];
    #ifdef RCT_NEW_ARCH_ENABLED
      initProps[kRNConcurrentRoot] = @YES;
    #endif

    BOOL enableFabric = NO;
    #if RCT_NEW_ARCH_ENABLED
        enableFabric = TRUE;
    #endif

    return RCTAppSetupDefaultRootView(bridge, moduleName, initProps, enableFabric);
}

@end
