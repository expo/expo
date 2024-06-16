#import <EXDevMenu/DevClientAppDelegate.h>
#import <EXDevMenu/DevClientRootViewFactory.h>

#import <React/RCTBundleURLProvider.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <React/RCTComponentViewFactory.h>
#if __has_include(<React_RCTAppDelegate/RCTAppSetupUtils.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppSetupUtils.h>
#else
#import <React-RCTAppDelegate/RCTAppSetupUtils.h>
#endif

#ifdef RCT_NEW_ARCH_ENABLED
#import <memory>

#import <React/CoreModulesPlugins.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <ReactCommon/RCTContextContainerHandling.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <react/config/ReactNativeConfig.h>

#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>

#endif

@interface RCTAppDelegate () <RCTComponentViewFactoryComponentProvider, RCTTurboModuleManagerDelegate>

@end

@implementation DevClientAppDelegate

- (RCTRootViewFactory *)createRCTRootViewFactory
{
  RCTRootViewFactoryConfiguration *configuration =
  [[RCTRootViewFactoryConfiguration alloc] initWithBundleURL:self.bundleURL
                                              newArchEnabled:self.fabricEnabled
                                          turboModuleEnabled:self.turboModuleEnabled
                                           bridgelessEnabled:self.bridgelessEnabled];

  __weak __typeof(self) weakSelf = self;
  configuration.createRootViewWithBridge = ^UIView *(RCTBridge *bridge, NSString *moduleName, NSDictionary *initProps)
  {
    return [weakSelf createRootViewWithBridge:bridge moduleName:moduleName initProps:initProps];
  };

  configuration.createBridgeWithDelegate = ^RCTBridge *(id<RCTBridgeDelegate> bridge, NSDictionary *launchOptions)
  {
    return [weakSelf createBridgeWithDelegate:bridge launchOptions:launchOptions];
  };

  return [[DevClientRootViewFactory alloc] initWithConfiguration:configuration andTurboModuleManagerDelegate:self];
}

- (void)initRootViewFactory {
  RCTSetNewArchEnabled([self newArchEnabled]);
  RCTEnableTurboModule(self.turboModuleEnabled);

  self.rootViewFactory = [self createRCTRootViewFactory];

  if (self.newArchEnabled || self.fabricEnabled) {
    [RCTComponentViewFactory currentComponentViewFactory].thirdPartyFabricComponentsProvider = self;
  }
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [super sourceURLForBridge:bridge];
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  // Since we defined this selector but pretend that we don't implement it,
  // we should also fallthrough modouleProvider case at
  // https://github.com/facebook/react-native/blob/fd0ca4dd6209d79ac8c93dbffac2e3dca1caeadc/packages/react-native/React/CxxBridge/RCTCxxBridge.mm#L774-L778
  RCTBridgeModuleListProvider moduleProvider = [bridge valueForKey:@"_moduleProvider"];
  if (moduleProvider) {
    return moduleProvider();
  }
  return @[];
}

- (BOOL)bridge:(RCTBridge *)bridge didNotFindModule:(NSString *)moduleName
{
  return NO;
}


#pragma mark - New Arch Enabled settings

- (BOOL)newArchEnabled
{
#if RCT_NEW_ARCH_ENABLED
  return YES;
#else
  return NO;
#endif
}

@end
