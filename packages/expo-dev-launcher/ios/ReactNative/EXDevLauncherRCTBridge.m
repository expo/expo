// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXDevLauncher/EXDevLauncherRCTBridge.h>
#import <EXDevLauncher/EXDevLauncherController.h>
#import <EXDevLauncher/RCTCxxBridge+Private.h>

#import <React/RCTPerformanceLogger.h>
#import <React/RCTDevSettings.h>
#import <React/RCTDevMenu.h>

@import EXDevMenuInterface;

@implementation EXDevLauncherRCTCxxBridge

- (instancetype)initWithParentBridge:(RCTBridge *)bridge
{
  if ((self = [super initWithParentBridge:bridge])) {
    RCTBridge *appBridge = [EXDevLauncherController sharedInstance].appBridge;
    // reset the singleton `RCTBridge.currentBridge` to app bridge instance
    RCTBridge.currentBridge = appBridge != nil ? appBridge.batchedBridge : nil;
  }
  return self;
}

/**
 * Theoretically, we could overwrite the `RCTDevSettings` module by exporting our version through the bridge.
 * However, this won't work with the js remote debugging. For some reason, the RN needs to initialized remote tools very early. So it always uses the default module to do it.
 * When we export our module, it won't be used in the initialized phase. So the launcher will start with remote debug support.
 */
- (RCTDevSettings *)devSettings
{
#ifdef EX_DEV_LAUNCHER_URL
 return super.devSettings;
#endif
 return nil;
}

- (RCTDevMenu *)devMenu
{
  return nil;
}

- (NSArray<Class> *)filterModuleList:(NSArray<Class> *)modules
{
  NSArray<NSString *> *allowedModules = @[
    @"RCT",
    @"DevMenu",
    @"ExpoBridgeModule",
    @"EXNativeModulesProxy",
    @"ViewManagerAdapter_",
    @"ExpoModulesCore",
    @"EXReactNativeEventEmitter"
  ];
  NSArray<Class> *filteredModuleList = [modules filteredArrayUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(id  _Nullable clazz, NSDictionary<NSString *,id> * _Nullable bindings) {
    if ([clazz conformsToProtocol:@protocol(DevMenuExtensionProtocol)]) {
      return true;
    }

    if ([clazz conformsToProtocol:@protocol(EXDevExtensionProtocol)]) {
      return true;
    }

    NSString* clazzName = NSStringFromClass(clazz);
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
  return [super _initializeModules:[self filterModuleList:modules] withDispatchGroup:dispatchGroup lazilyDiscovered:lazilyDiscovered];
}

@end

@implementation EXDevLauncherRCTBridge

- (Class)bridgeClass
{
  return [EXDevLauncherRCTCxxBridge class];
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-implementations"
// This method is still used so we need to override it even if it's deprecated
- (void)reloadWithReason:(NSString *)reason {}
#pragma clang diagnostic pop

@end
