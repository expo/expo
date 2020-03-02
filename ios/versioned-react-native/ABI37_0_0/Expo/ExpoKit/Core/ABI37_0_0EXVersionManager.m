// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI37_0_0EXAppState.h"
#import "ABI37_0_0EXDevSettings.h"
#import "ABI37_0_0EXDisabledDevLoadingView.h"
#import "ABI37_0_0EXDisabledDevMenu.h"
#import "ABI37_0_0EXDisabledRedBox.h"
#import "ABI37_0_0EXFileSystem.h"
#import "ABI37_0_0EXVersionManager.h"
#import "ABI37_0_0EXScopedBridgeModule.h"
#import "ABI37_0_0EXStatusBarManager.h"
#import "ABI37_0_0EXUnversioned.h"
#import "ABI37_0_0EXScopedFileSystemModule.h"
#import "ABI37_0_0EXTest.h"

#import <ABI37_0_0React/ABI37_0_0RCTAssert.h>
#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0RCTBridge+Private.h>
#import <ABI37_0_0React/ABI37_0_0RCTDevMenu.h>
#import <ABI37_0_0React/ABI37_0_0RCTDevSettings.h>
#import <ABI37_0_0React/ABI37_0_0RCTExceptionsManager.h>
#import <ABI37_0_0React/ABI37_0_0RCTLog.h>
#import <ABI37_0_0React/ABI37_0_0RCTRedBox.h>
#import <ABI37_0_0React/ABI37_0_0RCTPackagerConnection.h>
#import <ABI37_0_0React/ABI37_0_0RCTModuleData.h>
#import <ABI37_0_0React/ABI37_0_0RCTUtils.h>

#import <ABI37_0_0React/ABI37_0_0RCTAsyncLocalStorage.h>

#import <objc/message.h>

#import <ABI37_0_0UMFileSystemInterface/ABI37_0_0UMFileSystemInterface.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistry.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryDelegate.h>
#import <ABI37_0_0UMReactNativeAdapter/ABI37_0_0UMNativeModulesProxy.h>
#import "ABI37_0_0EXScopedModuleRegistryAdapter.h"
#import "ABI37_0_0EXScopedModuleRegistryDelegate.h"

// used for initializing scoped modules which don't tie in to any kernel service.
#define ABI37_0_0EX_KERNEL_SERVICE_NONE @"ABI37_0_0EXKernelServiceNone"

// this is needed because ABI37_0_0RCTPerfMonitor does not declare a public interface
// anywhere that we can import.
@interface ABI37_0_0RCTPerfMonitorDevSettingsHack <NSObject>

- (void)hide;
- (void)show;

@end

static NSMutableDictionary<NSString *, NSDictionary *> *ABI37_0_0EXScopedModuleClasses;
void ABI37_0_0EXRegisterScopedModule(Class, ...);
void ABI37_0_0EXRegisterScopedModule(Class moduleClass, ...)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    ABI37_0_0EXScopedModuleClasses = [NSMutableDictionary dictionary];
  });
  
  NSString *kernelServiceClassName;
  va_list argumentList;
  NSMutableDictionary *unversionedKernelServiceClassNames = [[NSMutableDictionary alloc] init];
  
  va_start(argumentList, moduleClass);
    while ((kernelServiceClassName = va_arg(argumentList, NSString*))) {
      if ([kernelServiceClassName isEqualToString:@"nil"]) {
        unversionedKernelServiceClassNames[kernelServiceClassName] = ABI37_0_0EX_KERNEL_SERVICE_NONE;
      } else {
        unversionedKernelServiceClassNames[kernelServiceClassName] = [@"EX" stringByAppendingString:kernelServiceClassName];
      }
    }
  va_end(argumentList);
  
  NSString *moduleClassName = NSStringFromClass(moduleClass);
  if (moduleClassName) {
    ABI37_0_0EXScopedModuleClasses[moduleClassName] = unversionedKernelServiceClassNames;
  }
}

@interface ABI37_0_0RCTBridgeHack <NSObject>

- (void)reload;

@end

@interface ABI37_0_0EXVersionManager ()

// is this the first time this ABI has been touched at runtime?
@property (nonatomic, assign) BOOL isFirstLoad;

@end

@implementation ABI37_0_0EXVersionManager

- (instancetype)initWithFatalHandler:(void (^)(NSError *))fatalHandler
                         logFunction:(void (^)(NSInteger, NSInteger, NSString *, NSNumber *, NSString *))logFunction
                        logThreshold:(NSInteger)threshold
{
  if (self = [super init]) {
    [self configureABIWithFatalHandler:fatalHandler logFunction:logFunction logThreshold:threshold];
  }
  return self;
}

- (void)bridgeWillStartLoading:(id)bridge
{
  // Override the "Reload" button from Redbox to reload the app from manifest
  // Keep in mind that it is possible this will return a ABI37_0_0EXDisabledRedBox
  ABI37_0_0RCTRedBox *redBox = [self _moduleInstanceForBridge:bridge named:@"RedBox"];
  [redBox setOverrideReloadAction:^{
      [[NSNotificationCenter defaultCenter]
     postNotificationName:@"EXReloadActiveAppRequest" object:nil];
  }];

  // We need to check DEBUG flag here because in ejected projects ABI37_0_0RCT_DEV is set only for ABI37_0_0React and not for ExpoKit to which this file belongs to.
  // It can be changed to just ABI37_0_0RCT_DEV once we deprecate ExpoKit and set that flag for the entire standalone project.
#if DEBUG || ABI37_0_0RCT_DEV
  if ([self _isDevModeEnabledForBridge:bridge]) {
    // Set the bundle url for the packager connection manually
    [[ABI37_0_0RCTPackagerConnection sharedPackagerConnection] setBundleURL:[bridge bundleURL]];
  }
#endif

  // Manually send a "start loading" notif, since the real one happened uselessly inside the ABI37_0_0RCTBatchedBridge constructor
  [[NSNotificationCenter defaultCenter]
   postNotificationName:ABI37_0_0RCTJavaScriptWillStartLoadingNotification object:bridge];
}

- (void)bridgeFinishedLoading {

}

- (void)invalidate
{

}

- (NSDictionary<NSString *, NSString *> *)devMenuItemsForBridge:(id)bridge
{
  ABI37_0_0RCTDevSettings *devSettings = [self _moduleInstanceForBridge:bridge named:@"DevSettings"];
  BOOL isDevModeEnabled = [self _isDevModeEnabledForBridge:bridge];
  NSMutableDictionary *items = [NSMutableDictionary new];

  if (isDevModeEnabled) {
    items[@"dev-inspector"] = @{
      @"label": devSettings.isElementInspectorShown ? @"Hide Element Inspector" : @"Show Element Inspector",
      @"isEnabled": @YES
    };
  } else {
    items[@"dev-inspector"] = @{
      @"label": @"Element Inspector Unavailable",
      @"isEnabled": @NO
    };
  }
  
  if (devSettings.isRemoteDebuggingAvailable && isDevModeEnabled) {
    items[@"dev-remote-debug"] = @{
      @"label": (devSettings.isDebuggingRemotely) ? @"Stop Remote Debugging" : @"Debug Remote JS",
      @"isEnabled": @YES
    };
  } else {
    items[@"dev-remote-debug"] =  @{
      @"label": @"Remote Debugger Unavailable",
      @"isEnabled": @NO
    };
  }

  if (devSettings.isHotLoadingAvailable && isDevModeEnabled) {
    items[@"dev-hmr"] = @{
      @"label": (devSettings.isHotLoadingEnabled) ? @"Disable Fast Refresh" : @"Enable Fast Refresh",
      @"isEnabled": @YES,
    };
  } else {
    items[@"dev-hmr"] =  @{
      @"label": @"Fast Refresh Unavailable",
      @"isEnabled": @NO,
      @"detail": @"Use the Reload button above to reload when in production mode. Switch back to development mode to use Fast Refresh."
    };
  }

  id perfMonitor = [self _moduleInstanceForBridge:bridge named:@"PerfMonitor"];
  if (perfMonitor && isDevModeEnabled) {
    items[@"dev-perf-monitor"] = @{
      @"label": devSettings.isPerfMonitorShown ? @"Hide Performance Monitor" : @"Show Performance Monitor",
      @"isEnabled": @YES,
    };
  } else {
    items[@"dev-perf-monitor"] = @{
      @"label": @"Performance Monitor Unavailable",
      @"isEnabled": @NO,
    };
  }

  return items;
}

- (void)selectDevMenuItemWithKey:(NSString *)key onBridge:(id)bridge
{
  ABI37_0_0RCTAssertMainQueue();
  ABI37_0_0RCTDevSettings *devSettings = [self _moduleInstanceForBridge:bridge named:@"DevSettings"];
  if ([key isEqualToString:@"dev-reload"]) {
    // bridge could be an ABI37_0_0RCTBridge of any version and we need to cast it since ARC needs to know
    // the return type
    [(ABI37_0_0RCTBridgeHack *)bridge reload];
  } else if ([key isEqualToString:@"dev-remote-debug"]) {
    devSettings.isDebuggingRemotely = !devSettings.isDebuggingRemotely;
  } else if ([key isEqualToString:@"dev-profiler"]) {
    devSettings.isProfilingEnabled = !devSettings.isProfilingEnabled;
  } else if ([key isEqualToString:@"dev-hmr"]) {
    devSettings.isHotLoadingEnabled = !devSettings.isHotLoadingEnabled;
  } else if ([key isEqualToString:@"dev-inspector"]) {
    [devSettings toggleElementInspector];
  } else if ([key isEqualToString:@"dev-perf-monitor"]) {
    id perfMonitor = [self _moduleInstanceForBridge:bridge named:@"PerfMonitor"];
    if (perfMonitor) {
      if (devSettings.isPerfMonitorShown) {
        [perfMonitor hide];
        devSettings.isPerfMonitorShown = NO;
      } else {
        [perfMonitor show];
        devSettings.isPerfMonitorShown = YES;
      }
    }
  }
}

- (void)showDevMenuForBridge:(id)bridge
{
  ABI37_0_0RCTAssertMainQueue();
  id devMenu = [self _moduleInstanceForBridge:bridge named:@"DevMenu"];
  // respondsToSelector: check is required because it's possible this bridge
  // was instantiated with a `disabledDevMenu` instance and the gesture preference was recently updated.
  if ([devMenu respondsToSelector:@selector(show)]) {
    [((ABI37_0_0RCTDevMenu *)devMenu) show];
  }
}

- (void)disableRemoteDebuggingForBridge:(id)bridge
{
  ABI37_0_0RCTDevSettings *devSettings = [self _moduleInstanceForBridge:bridge named:@"DevSettings"];
  devSettings.isDebuggingRemotely = NO;
}

- (void)toggleElementInspectorForBridge:(id)bridge
{
  ABI37_0_0RCTDevSettings *devSettings = [self _moduleInstanceForBridge:bridge named:@"DevSettings"];
  [devSettings toggleElementInspector];
}


#pragma mark - internal

- (BOOL)_isDevModeEnabledForBridge:(id)bridge
{
  return ([ABI37_0_0RCTGetURLQueryParam([bridge bundleURL], @"dev") boolValue]);
}

- (id<ABI37_0_0RCTBridgeModule>)_moduleInstanceForBridge:(id)bridge named:(NSString *)name
{
  if ([bridge respondsToSelector:@selector(batchedBridge)]) {
    bridge = [bridge batchedBridge];
  }
  ABI37_0_0RCTModuleData *data = [bridge moduleDataForName:name];
  if (data) {
    return [data instance];
  }
  return nil;
}

- (void)configureABIWithFatalHandler:(void (^)(NSError *))fatalHandler
                         logFunction:(void (^)(NSInteger, NSInteger, NSString *, NSNumber *, NSString *))logFunction
                        logThreshold:(NSInteger)threshold
{
  ABI37_0_0RCTSetFatalHandler(fatalHandler);
  ABI37_0_0RCTSetLogThreshold(threshold);
  ABI37_0_0RCTSetLogFunction(logFunction);
}

/**
 *  Expected params:
 *    NSDictionary *manifest
 *    NSDictionary *constants
 *    NSURL *initialUri
 *    @BOOL isDeveloper
 *    @BOOL isStandardDevMenuAllowed
 *    @ABI37_0_0EXTestEnvironment testEnvironment
 *    NSDictionary *services
 *
 * Kernel-only:
 *    ABI37_0_0EXKernel *kernel
 *    NSArray *supportedSdkVersions
 *    id exceptionsManagerDelegate
 */
- (NSArray *)extraModulesWithParams:(NSDictionary *)params
{
  BOOL isDeveloper = [params[@"isDeveloper"] boolValue];
  NSDictionary *manifest = params[@"manifest"];
  NSString *experienceId = manifest[@"id"];
  NSDictionary *services = params[@"services"];
  BOOL isOpeningHomeInProductionMode = params[@"browserModuleClass"] && !manifest[@"developer"];

  NSMutableArray *extraModules = [NSMutableArray arrayWithArray:
                                  @[
                                    [[ABI37_0_0EXAppState alloc] init],
                                    [[ABI37_0_0EXDevSettings alloc] initWithExperienceId:experienceId isDevelopment:(!isOpeningHomeInProductionMode && isDeveloper)],
                                    [[ABI37_0_0EXDisabledDevLoadingView alloc] init],
                                    [[ABI37_0_0EXStatusBarManager alloc] init],
                                    ]];
  
  // add scoped modules
  [extraModules addObjectsFromArray:[self _newScopedModulesWithExperienceId:experienceId services:services params:params]];

  id exceptionsManagerDelegate = params[@"exceptionsManagerDelegate"];
  if (exceptionsManagerDelegate) {
    ABI37_0_0RCTExceptionsManager *exceptionsManager = [[ABI37_0_0RCTExceptionsManager alloc] initWithDelegate:exceptionsManagerDelegate];
    [extraModules addObject:exceptionsManager];
  } else {
    ABI37_0_0RCTLogWarn(@"No exceptions manager provided when building extra modules for bridge.");
  }
  
  if (params[@"testEnvironment"]) {
    ABI37_0_0EXTestEnvironment testEnvironment = (ABI37_0_0EXTestEnvironment)[params[@"testEnvironment"] unsignedIntegerValue];
    if (testEnvironment != ABI37_0_0EXTestEnvironmentNone) {
      ABI37_0_0EXTest *testModule = [[ABI37_0_0EXTest alloc] initWithEnvironment:testEnvironment];
      [extraModules addObject:testModule];
    }
  }
  
  if (params[@"browserModuleClass"]) {
    Class browserModuleClass = params[@"browserModuleClass"];
    id homeModule = [[browserModuleClass alloc] initWithExperienceId:experienceId
                                                    kernelServiceDelegate:services[@"EXHomeModuleManager"]
                                                                   params:params];
    [extraModules addObject:homeModule];
  }

  if ([params[@"isStandardDevMenuAllowed"] boolValue] && isDeveloper) {
    [extraModules addObject:[[ABI37_0_0RCTDevMenu alloc] init]];
  } else {
    // non-kernel, or non-development kernel, uses expo menu instead of ABI37_0_0RCTDevMenu
    [extraModules addObject:[[ABI37_0_0EXDisabledDevMenu alloc] init]];
  }
  if (!isDeveloper) {
    // user-facing (not debugging).
    // additionally disable ABI37_0_0RCTRedBox
    [extraModules addObject:[[ABI37_0_0EXDisabledRedBox alloc] init]];
  }

  ABI37_0_0UMModuleRegistryProvider *moduleRegistryProvider = [[ABI37_0_0UMModuleRegistryProvider alloc] initWithSingletonModules:params[@"singletonModules"]];

  Class resolverClass = [ABI37_0_0EXScopedModuleRegistryDelegate class];
  if (params[@"moduleRegistryDelegateClass"] && params[@"moduleRegistryDelegateClass"] != [NSNull null]) {
    resolverClass = params[@"moduleRegistryDelegateClass"];
  }

  id<ABI37_0_0UMModuleRegistryDelegate> moduleRegistryDelegate = [[resolverClass alloc] initWithParams:params];
  [moduleRegistryProvider setModuleRegistryDelegate:moduleRegistryDelegate];

  ABI37_0_0EXScopedModuleRegistryAdapter *moduleRegistryAdapter = [[ABI37_0_0EXScopedModuleRegistryAdapter alloc] initWithModuleRegistryProvider:moduleRegistryProvider];
  ABI37_0_0UMModuleRegistry *moduleRegistry = [moduleRegistryAdapter moduleRegistryForParams:params forExperienceId:experienceId withKernelServices:services];
  NSArray<id<ABI37_0_0RCTBridgeModule>> *expoModules = [moduleRegistryAdapter extraModulesForModuleRegistry:moduleRegistry];
  [extraModules addObjectsFromArray:expoModules];

  id<ABI37_0_0UMFileSystemInterface> fileSystemModule = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMFileSystemInterface)];
  NSString *localStorageDirectory = [fileSystemModule.documentDirectory stringByAppendingPathComponent:@"RCTAsyncLocalStorage"];
  [extraModules addObject:[[ABI37_0_0RCTAsyncLocalStorage alloc] initWithStorageDirectory:localStorageDirectory]];

  return extraModules;
}

- (NSArray *)_newScopedModulesWithExperienceId: (NSString *)experienceId services:(NSDictionary *)services params:(NSDictionary *)params
{
  NSMutableArray *result = [NSMutableArray array];
  if (ABI37_0_0EXScopedModuleClasses) {
    [ABI37_0_0EXScopedModuleClasses enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull scopedModuleClassName, NSDictionary * _Nonnull kernelServiceClassNames, BOOL * _Nonnull stop) {
      NSMutableDictionary *moduleServices = [[NSMutableDictionary alloc] init];
      for (id kernelServiceClassName in kernelServiceClassNames) {
        NSString *kernelSerivceName = kernelServiceClassNames[kernelServiceClassName];
        id service = ([kernelSerivceName isEqualToString:ABI37_0_0EX_KERNEL_SERVICE_NONE]) ? [NSNull null] : services[kernelSerivceName];
        moduleServices[kernelServiceClassName] = service;
      }
      
      id scopedModule;
      Class scopedModuleClass = NSClassFromString(scopedModuleClassName);
      if (moduleServices.count > 1) {
        scopedModule = [[scopedModuleClass alloc] initWithExperienceId:experienceId kernelServiceDelegates:moduleServices params:params];
      } else if (moduleServices.count == 0) {
        scopedModule = [[scopedModuleClass alloc] initWithExperienceId:experienceId kernelServiceDelegate:nil params:params];
      } else {
        scopedModule = [[scopedModuleClass alloc] initWithExperienceId:experienceId kernelServiceDelegate:moduleServices[[moduleServices allKeys][0]] params:params];
      }
      
      if (scopedModule) {
        [result addObject:scopedModule];
      }
    }];
  }
  return result;
}

@end
