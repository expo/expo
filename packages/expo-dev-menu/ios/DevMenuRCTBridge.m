// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXDevMenu/DevMenuRCTBridge.h>
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

@import EXDevMenuInterface;

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
  NSArray<NSString *> *allowedModules = @[@"RCT"];
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
