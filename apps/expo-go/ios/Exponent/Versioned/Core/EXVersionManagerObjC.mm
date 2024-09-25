// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppState.h"
#import "EXDevSettings.h"
#import "EXDisabledDevLoadingView.h"
#import "EXDisabledDevMenu.h"
#import "EXDisabledRedBox.h"
#import "EXVersionedNetworkInterceptor.h"
#import "EXVersionManagerObjC.h"
#import "EXScopedBridgeModule.h"
#import "EXStatusBarManager.h"
#import "EXUnversioned.h"
#import "EXTest.h"

#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTDevMenu.h>
#import <React/RCTDevSettings.h>
#import <React/RCTExceptionsManager.h>
#import <React/RCTLog.h>
#import <React/RCTRedBox.h>
#import <React/RCTPackagerConnection.h>
#import <React/RCTModuleData.h>
#import <React/RCTUtils.h>
#import <React/RCTDataRequestHandler.h>
#import <React/RCTFileRequestHandler.h>
#import <React/RCTHTTPRequestHandler.h>
#import <React/RCTNetworking.h>
#import <React/RCTBundleAssetImageLoader.h>
#import <React/RCTGIFImageDecoder.h>
#import <React/RCTImageLoader.h>
#import <React/RCTInspectorDevServerHelper.h>
#import <React/CoreModulesPlugins.h>

#import <ExpoModulesCore/EXNativeModulesProxy.h>
#import <ExpoModulesCore/EXModuleRegistryHolderReactModule.h>
#import <React/RCTFabricSurface.h>
#import <React/RCTSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <react/config/ReactNativeConfig.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#import <React/RCTUIManager.h>
#import <React/RCTJSIExecutorRuntimeInstaller.h>
#import <reacthermes/HermesExecutorFactory.h>

#import <React/RCTJSIExecutorRuntimeInstaller.h>
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>

// When `use_frameworks!` is used, the generated Swift header is inside modules.
// Otherwise, it's available only locally with double-quoted imports.
#if __has_include(<EXManifests/EXManifests-Swift.h>)
#import <EXManifests/EXManifests-Swift.h>
#else
#import "EXManifests-Swift.h"
#endif

// Import 3rd party modules that need to be scoped.
#import "RNCAsyncStorage/RNCAsyncStorage.h"
#import "RNCWebViewManager.h"

#import "EXScopedModuleRegistry.h"
#import "EXScopedModuleRegistryAdapter.h"
#import "EXScopedModuleRegistryDelegate.h"

#import "Expo_Go-Swift.h"

RCT_EXTERN NSDictionary<NSString *, NSDictionary *> *EXGetScopedModuleClasses(void);
RCT_EXTERN void EXRegisterScopedModule(Class, ...);

// this is needed because RCTPerfMonitor does not declare a public interface
// anywhere that we can import.
@interface RCTPerfMonitorDevSettingsHack <NSObject>

- (void)hide;
- (void)show;

@end

@interface RCTBridgeHack <NSObject>

- (void)reload;

@end

@interface EXVersionManagerObjC () <RCTTurboModuleManagerDelegate> {
  std::shared_ptr<const facebook::react::ReactNativeConfig> _reactNativeConfig;
  facebook::react::ContextContainer::Shared _contextContainer;
}

// is this the first time this ABI has been touched at runtime?
@property (nonatomic, assign) BOOL isFirstLoad;
@property (nonatomic, strong) NSDictionary *params;
@property (nonatomic, strong) EXManifestsManifest *manifest;
@property (nonatomic, strong) EXVersionedNetworkInterceptor *networkInterceptor;
@property (nonatomic, strong) RCTTurboModuleManager *turboModuleManager;
@property (nonatomic, strong) RCTSurfacePresenterBridgeAdapter *bridgeAdapter;
@property (nonatomic, assign, readonly) BOOL fabricEnabled;

// Legacy
@property (nonatomic, strong) EXModuleRegistry *legacyModuleRegistry;
@property (nonatomic, strong) EXNativeModulesProxy *legacyModulesProxy;

@end

@implementation EXVersionManagerObjC

/**
 * Uses a params dict since the internal workings may change over time, but we want to keep the interface the same.
 *  Expected params:
 *    NSDictionary *constants
 *    NSURL *initialUri
 *    @BOOL isDeveloper
 *    @BOOL isStandardDevMenuAllowed
 *    @EXTestEnvironment testEnvironment
 *    NSDictionary *services
 *
 * Kernel-only:
 *    EXKernel *kernel
 *    NSArray *supportedSdkVersions
 *    id exceptionsManagerDelegate
 */
- (nonnull instancetype)initWithParams:(nonnull NSDictionary *)params
                              manifest:(nonnull EXManifestsManifest *)manifest
                          fatalHandler:(void (^ _Nonnull)(NSError * _Nullable))fatalHandler
                           logFunction:(nonnull RCTLogFunction)logFunction
                          logThreshold:(RCTLogLevel)logThreshold
{
  if (self = [super init]) {
    _params = params;
    _manifest = manifest;
    _fabricEnabled = true;
  }
  return self;
}

+ (void)load
{
  // Register scoped 3rd party modules. Some of them are separate pods that
  // don't have access to EXScopedModuleRegistry and so they can't register themselves.
  EXRegisterScopedModule([RNCWebViewManager class], EX_KERNEL_SERVICE_NONE, nil);
}

- (void)bridgeWillStartLoading:(id)bridge
{
  if ([self _isDevModeEnabledForBridge:bridge]) {
    // Set the bundle url for the packager connection manually
    NSURL *bundleURL = [bridge bundleURL];
    NSString *packagerServerHostPort = [NSString stringWithFormat:@"%@:%@", bundleURL.host, bundleURL.port];
    [[RCTPackagerConnection sharedPackagerConnection] reconnect:packagerServerHostPort];
    RCTInspectorPackagerConnection *inspectorPackagerConnection = [RCTInspectorDevServerHelper connectWithBundleURL:bundleURL];

    NSDictionary<NSString *, id> *buildProps = [self.manifest getPluginPropertiesWithPackageName:@"expo-build-properties"];
    NSNumber *enableNetworkInterceptor = [[buildProps objectForKey:@"ios"] objectForKey:@"unstable_networkInspector"];
    if (enableNetworkInterceptor == nil || [enableNetworkInterceptor boolValue] != NO) {
      self.networkInterceptor = [[EXVersionedNetworkInterceptor alloc] initWithRCTInspectorPackagerConnection:inspectorPackagerConnection];
    }
  }

  // Manually send a "start loading" notif, since the real one happened uselessly inside the RCTBatchedBridge constructor
  [[NSNotificationCenter defaultCenter]
   postNotificationName:RCTJavaScriptWillStartLoadingNotification object:bridge];
}

- (void)bridgeFinishedLoading:(id)bridge
{
  // Override the "Reload" button from Redbox to reload the app from manifest
  // Keep in mind that it is possible this will return a EXDisabledRedBox
  id clazz = [bridge getModuleClassFromName:"RedBox"];
  RCTRedBox *redBox = (RCTRedBox *)[bridge getModuleInstanceFromClass:clazz];
  [redBox setOverrideReloadAction:^{
    [[NSNotificationCenter defaultCenter] postNotificationName:EX_UNVERSIONED(@"EXReloadActiveAppRequest") object:nil];
  }];
}

- (void)invalidate {
  self.networkInterceptor = nil;
}

#pragma mark - Dev menu

- (NSDictionary<NSString *, NSString *> *)devMenuItemsForBridge:(id)bridge
{
  RCTDevSettings *devSettings = (RCTDevSettings *)[bridge getModuleInstanceFromClass:[bridge getModuleClassFromName:"DevSettings"]];
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

  items[@"dev-remote-debug"] = @{
    @"label": @"Open JS Debugger",
    @"isEnabled": @YES
  };

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
  RCTAssertMainQueue();
  RCTDevSettings *devSettings = (RCTDevSettings *)[self _moduleInstanceForBridge:bridge named:@"DevSettings"];
  if ([key isEqualToString:@"dev-reload"]) {
    // bridge could be an RCTBridge of any version and we need to cast it since ARC needs to know
    // the return type
    [(RCTBridgeHack *)bridge reload];
  } else if ([key isEqualToString:@"dev-remote-debug"]) {
    [self _openJsInspector:bridge];
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
  RCTAssertMainQueue();
  id devMenu = [self _moduleInstanceForBridge:bridge named:@"DevMenu"];
  // respondsToSelector: check is required because it's possible this bridge
  // was instantiated with a `disabledDevMenu` instance and the gesture preference was recently updated.
  if ([devMenu respondsToSelector:@selector(show)]) {
    [((RCTDevMenu *)devMenu) show];
  }
}

- (void)disableRemoteDebuggingForBridge:(id)bridge
{
  RCTDevSettings *devSettings = (RCTDevSettings *)[self _moduleInstanceForBridge:bridge named:@"DevSettings"];
  devSettings.isDebuggingRemotely = NO;
}

- (void)toggleRemoteDebuggingForBridge:(id)bridge
{
  RCTDevSettings *devSettings = (RCTDevSettings *)[self _moduleInstanceForBridge:bridge named:@"DevSettings"];
  devSettings.isDebuggingRemotely = !devSettings.isDebuggingRemotely;
}

- (void)togglePerformanceMonitorForBridge:(id)bridge
{
  RCTDevSettings *devSettings = (RCTDevSettings *)[self _moduleInstanceForBridge:bridge named:@"DevSettings"];
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

- (void)toggleElementInspectorForBridge:(id)bridge
{
  RCTDevSettings *devSettings = (RCTDevSettings *)[self _moduleInstanceForBridge:bridge named:@"DevSettings"];
  [devSettings toggleElementInspector];
}

- (uint32_t)addWebSocketNotificationHandler:(void (^)(NSDictionary<NSString *, id> *))handler
                                    queue:(dispatch_queue_t)queue
                                forMethod:(NSString *)method
{
  return [[RCTPackagerConnection sharedPackagerConnection] addNotificationHandler:handler queue:queue forMethod:method];
}

#pragma mark - internal

- (BOOL)_isDevModeEnabledForBridge:(id)bridge
{
  return ([RCTGetURLQueryParam([bridge bundleURL], @"dev") boolValue]);
}

- (void)_openJsInspector:(id)bridge
{
  NSInteger port = [[[bridge bundleURL] port] integerValue] ?: RCT_METRO_PORT;
  NSString *host = [[bridge bundleURL] host] ?: @"localhost";
  NSString *url =
      [NSString stringWithFormat:@"http://%@:%lld/_expo/debugger?applicationId=%@", host, (long long)port, NSBundle.mainBundle.bundleIdentifier];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:url]];
  request.HTTPMethod = @"PUT";
  [[[NSURLSession sharedSession] dataTaskWithRequest:request] resume];
}

- (id<RCTTurboModule>)_moduleInstanceForBridge:(id)bridge named:(NSString *)name
{
  return [bridge getModuleInstanceFromClass:[bridge getModuleClassFromName:[name UTF8String]]];
}

- (NSArray *)extraModulesForBridge:(id)bridge
{
  NSDictionary *params = _params;
  NSDictionary *services = params[@"services"];
  NSMutableArray *extraModules = [NSMutableArray new];

  // add scoped modules
  [extraModules addObjectsFromArray:[self _newScopedModulesForServices:services params:params]];

  if (params[@"testEnvironment"]) {
    EXTestEnvironment testEnvironment = (EXTestEnvironment)[params[@"testEnvironment"] unsignedIntegerValue];
    if (testEnvironment != EXTestEnvironmentNone) {
      EXTest *testModule = [[EXTest alloc] initWithEnvironment:testEnvironment];
      [extraModules addObject:testModule];
    }
  }

  if (params[@"browserModuleClass"]) {
    Class browserModuleClass = params[@"browserModuleClass"];
    id homeModule = [[browserModuleClass alloc] initWithExperienceStableLegacyId:self.manifest.stableLegacyId
                                                                        scopeKey:self.manifest.scopeKey
                                                                    easProjectId:self.manifest.easProjectId
                                                           kernelServiceDelegate:services[EX_UNVERSIONED(@"EXHomeModuleManager")]
                                                                          params:params];
    [extraModules addObject:homeModule];
  }

  [extraModules addObject:[self getModuleInstanceFromClass:[self getModuleClassFromName:"DevSettings"]]];
  id exceptionsManager = [self getModuleInstanceFromClass:RCTExceptionsManagerCls()];
  if (exceptionsManager) {
    [extraModules addObject:exceptionsManager];
  }
  [extraModules addObject:[self getModuleInstanceFromClass:[self getModuleClassFromName:"DevMenu"]]];
  [extraModules addObject:[self getModuleInstanceFromClass:[self getModuleClassFromName:"RedBox"]]];
  
  return extraModules;
}

- (NSArray *)_newScopedModulesForServices:(NSDictionary *)services params:(NSDictionary *)params
{
  NSMutableArray *result = [NSMutableArray array];
  NSDictionary<NSString *, NSDictionary *> *EXScopedModuleClasses = EXGetScopedModuleClasses();
  if (EXScopedModuleClasses) {
    [EXScopedModuleClasses enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull scopedModuleClassName, NSDictionary * _Nonnull kernelServiceClassNames, BOOL * _Nonnull stop) {
      NSMutableDictionary *moduleServices = [[NSMutableDictionary alloc] init];
      for (id kernelServiceClassName in kernelServiceClassNames) {
        NSString *kernelSerivceName = kernelServiceClassNames[kernelServiceClassName];
        id service = ([kernelSerivceName isEqualToString:EX_KERNEL_SERVICE_NONE]) ? [NSNull null] : services[kernelSerivceName];
        moduleServices[kernelServiceClassName] = service;
      }

      id scopedModule;
      Class scopedModuleClass = NSClassFromString(scopedModuleClassName);
      if (moduleServices.count > 1) {
        scopedModule = [[scopedModuleClass alloc] initWithExperienceStableLegacyId:self.manifest.stableLegacyId
                                                                          scopeKey:self.manifest.scopeKey
                                                                      easProjectId:self.manifest.easProjectId
                                                            kernelServiceDelegates:moduleServices
                                                                            params:params];
      } else if (moduleServices.count == 0) {
        scopedModule = [[scopedModuleClass alloc] initWithExperienceStableLegacyId:self.manifest.stableLegacyId
                                                                          scopeKey:self.manifest.scopeKey
                                                                      easProjectId:self.manifest.easProjectId
                                                             kernelServiceDelegate:nil
                                                                            params:params];
      } else {
        scopedModule = [[scopedModuleClass alloc] initWithExperienceStableLegacyId:self.manifest.stableLegacyId
                                                                          scopeKey:self.manifest.scopeKey
                                                                      easProjectId:self.manifest.easProjectId
                                                             kernelServiceDelegate:moduleServices[[moduleServices allKeys][0]]
                                                                            params:params];
      }

      if (scopedModule) {
        [result addObject:scopedModule];
      }
    }];
  }
  return result;
}

- (Class)getModuleClassFromName:(const char *)name
{
  if (strcmp(name, "DevSettings") == 0) {
    return EXDevSettings.class;
  }
  if (strcmp(name, "DevMenu") == 0) {
    if (![_params[@"isStandardDevMenuAllowed"] boolValue] || ![_params[@"isDeveloper"] boolValue]) {
      // non-kernel, or non-development kernel, uses expo menu instead of RCTDevMenu
      return EXDisabledDevMenu.class;
    }
  }
  if (strcmp(name, "RedBox") == 0) {
    if (![_params[@"isDeveloper"] boolValue]) {
      // user-facing (not debugging).
      // additionally disable RCTRedBox
      return EXDisabledRedBox.class;
    }
  }
  return RCTCoreModulesClassProvider(name);
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  // Standard
  if (moduleClass == RCTImageLoader.class) {
    return [[moduleClass alloc] initWithRedirectDelegate:nil loadersProvider:^NSArray<id<RCTImageURLLoader>> *(RCTModuleRegistry *) {
      return @[[RCTBundleAssetImageLoader new]];
    } decodersProvider:^NSArray<id<RCTImageDataDecoder>> *(RCTModuleRegistry *) {
      return @[[RCTGIFImageDecoder new]];
    }];
  } else if (moduleClass == RCTNetworking.class) {
    return [[moduleClass alloc] initWithHandlersProvider:^NSArray<id<RCTURLRequestHandler>> *(RCTModuleRegistry *) {
      return @[
        [RCTHTTPRequestHandler new],
        [RCTDataRequestHandler new],
        [RCTFileRequestHandler new],
      ];
    }];
  }

  // Expo-specific
  if (moduleClass == EXDevSettings.class) {
    BOOL isDevelopment = ![self _isOpeningHomeInProductionMode] && [_params[@"isDeveloper"] boolValue];
    return [[moduleClass alloc] initWithScopeKey:self.manifest.scopeKey isDevelopment:isDevelopment];
  } else if (moduleClass == RCTExceptionsManagerCls()) {
    id exceptionsManagerDelegate = _params[@"exceptionsManagerDelegate"];
    if (exceptionsManagerDelegate) {
      return [[moduleClass alloc] initWithDelegate:exceptionsManagerDelegate];
    } else {
      RCTLogWarn(@"No exceptions manager provided when building extra modules for bridge.");
    }
  } else if (moduleClass == RNCAsyncStorage.class) {
    NSString *documentDirectory;
    if (_params[@"fileSystemDirectories"]) {
      documentDirectory = _params[@"fileSystemDirectories"][@"documentDirectory"];
    } else {
      NSArray<NSString *> *documentPaths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
      documentDirectory = [documentPaths objectAtIndex:0];
    }
    NSString *localStorageDirectory = [documentDirectory stringByAppendingPathComponent:EX_UNVERSIONED(@"RCTAsyncLocalStorage")];
    return [[moduleClass alloc] initWithStorageDirectory:localStorageDirectory];
  }

  return [moduleClass new];
}

- (BOOL)_isOpeningHomeInProductionMode
{
  return _params[@"browserModuleClass"] && !self.manifest.developer;
}

- (void *)versionedJsExecutorFactoryForBridge:(nonnull RCTBridge *)bridge
{
  return [EXVersionUtils versionedJsExecutorFactoryForBridge:bridge engine:_manifest.jsEngine];
}

@end
