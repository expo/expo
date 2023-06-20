// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppState.h"
#import "EXDevSettings.h"
#import "EXDisabledDevLoadingView.h"
#import "EXDisabledDevMenu.h"
#import "EXDisabledRedBox.h"
#import "EXVersionedNetworkInterceptor.h"
#import "EXVersionManager.h"
#import "EXScopedBridgeModule.h"
#import "EXStatusBarManager.h"
#import "EXUnversioned.h"
#import "EXScopedFileSystemModule.h"
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
#import <React/RCTLocalAssetImageLoader.h>
#import <React/RCTGIFImageDecoder.h>
#import <React/RCTImageLoader.h>
#import <React/RCTJSIExecutorRuntimeInstaller.h>
#import <React/RCTInspectorDevServerHelper.h>

#import <objc/message.h>

#import <ExpoModulesCore/EXDefines.h>
#import <ExpoModulesCore/EXModuleRegistry.h>
#import <ExpoModulesCore/EXModuleRegistryDelegate.h>
#import <ExpoModulesCore/EXModuleRegistryHolderReactModule.h>
#import <ExpoModulesCore/EXNativeModulesProxy.h>
#import <EXMediaLibrary/EXMediaLibraryImageLoader.h>
#import <EXFileSystem/EXFileSystem.h>
#import <EXManifests/EXManifests-Swift.h>

#import <RNReanimated/REAModule.h>
#import <RNReanimated/REAEventDispatcher.h>
#import <RNReanimated/REAUIManager.h>
#import <RNReanimated/NativeProxy.h>
#import <RNReanimated/ReanimatedVersion.h>

#import <React/RCTCxxBridgeDelegate.h>
#import <React/CoreModulesPlugins.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <reacthermes/HermesExecutorFactory.h>
#import <React/JSCExecutorFactory.h>
#import <strings.h>

// Import 3rd party modules that need to be scoped.
#import <RNCAsyncStorage/RNCAsyncStorage.h>
#import "RNCWebViewManager.h"

#import "EXScopedModuleRegistry.h"
#import "EXScopedModuleRegistryAdapter.h"
#import "EXScopedModuleRegistryDelegate.h"


RCT_EXTERN NSDictionary<NSString *, NSDictionary *> *EXGetScopedModuleClasses(void);
RCT_EXTERN void EXRegisterScopedModule(Class, ...);

@interface RCTEventDispatcher (REAnimated)

- (void)setBridge:(RCTBridge*)bridge;

@end

// this is needed because RCTPerfMonitor does not declare a public interface
// anywhere that we can import.
@interface RCTPerfMonitorDevSettingsHack <NSObject>

- (void)hide;
- (void)show;

@end

@interface RCTBridgeHack <NSObject>

- (void)reload;

@end

@interface EXVersionManager () <RCTTurboModuleManagerDelegate>

// is this the first time this ABI has been touched at runtime?
@property (nonatomic, assign) BOOL isFirstLoad;
@property (nonatomic, strong) NSDictionary *params;
@property (nonatomic, strong) EXManifestsManifest *manifest;
@property (nonatomic, strong) RCTTurboModuleManager *turboModuleManager;
@property (nonatomic, strong) EXVersionedNetworkInterceptor *networkInterceptor;

@end

@implementation EXVersionManager

/**
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
- (instancetype)initWithParams:(NSDictionary *)params
                      manifest:(EXManifestsManifest *)manifest
                  fatalHandler:(void (^)(NSError *))fatalHandler
                   logFunction:(RCTLogFunction)logFunction
                  logThreshold:(NSInteger)threshold
{
  if (self = [super init]) {
    _params = params;
    _manifest = manifest;
    [self configureABIWithFatalHandler:fatalHandler logFunction:logFunction logThreshold:threshold];
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
  RCTRedBox *redBox = [self _moduleInstanceForBridge:bridge named:@"RedBox"];
  [redBox setOverrideReloadAction:^{
    [[NSNotificationCenter defaultCenter] postNotificationName:EX_UNVERSIONED(@"EXReloadActiveAppRequest") object:nil];
  }];
}

- (void)invalidate {
  self.networkInterceptor = nil;
}

- (NSDictionary<NSString *, NSString *> *)devMenuItemsForBridge:(id)bridge
{
  RCTDevSettings *devSettings = (RCTDevSettings *)[self _moduleInstanceForBridge:bridge named:@"DevSettings"];
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

  if ([self _isBridgeInspectable:bridge] && isDevModeEnabled) {
    items[@"dev-remote-debug"] = @{
      @"label": @"Open JS Debugger",
      @"isEnabled": @YES
    };
  } else if (
      [self.manifest.expoGoSDKVersion compare:@"49.0.0" options:NSNumericSearch] == NSOrderedAscending &&
      devSettings.isRemoteDebuggingAvailable &&
      isDevModeEnabled
    ) {
    items[@"dev-remote-debug"] = @{
      @"label": (devSettings.isDebuggingRemotely) ? @"Stop Remote Debugging" : @"Debug Remote JS",
      @"isEnabled": @YES
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
  RCTAssertMainQueue();
  RCTDevSettings *devSettings = (RCTDevSettings *)[self _moduleInstanceForBridge:bridge named:@"DevSettings"];
  if ([key isEqualToString:@"dev-reload"]) {
    // bridge could be an RCTBridge of any version and we need to cast it since ARC needs to know
    // the return type
    [(RCTBridgeHack *)bridge reload];
  } else if ([key isEqualToString:@"dev-remote-debug"]) {
    if ([self _isBridgeInspectable:bridge]) {
      [self _openJsInspector:bridge];
    } else {
      devSettings.isDebuggingRemotely = !devSettings.isDebuggingRemotely;
    }
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

- (BOOL)_isBridgeInspectable:(id)bridge
{
  return [[bridge batchedBridge] isInspectable];
}

- (void)_openJsInspector:(id)bridge
{
  NSInteger port = [[[bridge bundleURL] port] integerValue] ?: RCT_METRO_PORT;
  NSString *host = [[bridge bundleURL] host] ?: @"localhost";
  NSString *url =
      [NSString stringWithFormat:@"http://%@:%lld/inspector?applicationId=%@", host, (long long)port, NSBundle.mainBundle.bundleIdentifier];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:url]];
  request.HTTPMethod = @"PUT";
  [[[NSURLSession sharedSession] dataTaskWithRequest:request] resume];
}

- (id<RCTBridgeModule>)_moduleInstanceForBridge:(id)bridge named:(NSString *)name
{
  return [bridge moduleForClass:[self getModuleClassFromName:[name UTF8String]]];
}

- (void)configureABIWithFatalHandler:(void (^)(NSError *))fatalHandler
                         logFunction:(RCTLogFunction)logFunction
                        logThreshold:(NSInteger)threshold
{
  RCTEnableTurboModule([self.manifest.experiments[@"turboModules"] boolValue]);
  RCTSetFatalHandler(fatalHandler);
  RCTSetLogThreshold((RCTLogLevel) threshold);
  RCTSetLogFunction(logFunction);
}

- (NSArray *)extraModulesForBridge:(id)bridge
{
  NSDictionary *params = _params;
  NSDictionary *services = params[@"services"];

  NSMutableArray *extraModules = [NSMutableArray arrayWithArray:
                                  @[
                                    [[EXAppState alloc] init],
                                    [[EXDisabledDevLoadingView alloc] init],
                                    [[EXStatusBarManager alloc] init],
                                    ]];

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

  EXModuleRegistryProvider *moduleRegistryProvider = [[EXModuleRegistryProvider alloc] initWithSingletonModules:params[@"singletonModules"]];

  Class resolverClass = [EXScopedModuleRegistryDelegate class];
  if (params[@"moduleRegistryDelegateClass"] && params[@"moduleRegistryDelegateClass"] != [NSNull null]) {
    resolverClass = params[@"moduleRegistryDelegateClass"];
  }

  id<EXModuleRegistryDelegate> moduleRegistryDelegate = [[resolverClass alloc] initWithParams:params];
  [moduleRegistryProvider setModuleRegistryDelegate:moduleRegistryDelegate];

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  EXScopedModuleRegistryAdapter *moduleRegistryAdapter = [[EXScopedModuleRegistryAdapter alloc] initWithModuleRegistryProvider:moduleRegistryProvider];
#pragma clang diagnostic pop

  EXModuleRegistry *moduleRegistry = [moduleRegistryAdapter moduleRegistryForParams:params
                                                        forExperienceStableLegacyId:self.manifest.stableLegacyId
                                                                           scopeKey:self.manifest.scopeKey
                                                                           manifest:self.manifest
                                                                 withKernelServices:services];

  // Adding EXNativeModulesProxy with the custom moduleRegistry.
  EXNativeModulesProxy *expoNativeModulesProxy = [[EXNativeModulesProxy alloc] initWithCustomModuleRegistry:moduleRegistry];
  [extraModules addObject:expoNativeModulesProxy];

  // Adding the way to access the module registry from RCTBridgeModules.
  [extraModules addObject:[[EXModuleRegistryHolderReactModule alloc] initWithModuleRegistry:moduleRegistry]];

  if (!RCTTurboModuleEnabled()) {
    [extraModules addObject:[self getModuleInstanceFromClass:[self getModuleClassFromName:"DevSettings"]]];
    id exceptionsManager = [self getModuleInstanceFromClass:RCTExceptionsManagerCls()];
    if (exceptionsManager) {
      [extraModules addObject:exceptionsManager];
    }
    [extraModules addObject:[self getModuleInstanceFromClass:[self getModuleClassFromName:"DevMenu"]]];
    [extraModules addObject:[self getModuleInstanceFromClass:[self getModuleClassFromName:"RedBox"]]];
    [extraModules addObject:[self getModuleInstanceFromClass:RNCAsyncStorage.class]];
  }

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
  if (std::string(name) == "DevSettings") {
    return EXDevSettings.class;
  }
  if (std::string(name) == "DevMenu") {
    if (![_params[@"isStandardDevMenuAllowed"] boolValue] || ![_params[@"isDeveloper"] boolValue]) {
      // non-kernel, or non-development kernel, uses expo menu instead of RCTDevMenu
      return EXDisabledDevMenu.class;
    }
  }
  if (std::string(name) == "RedBox") {
    if (![_params[@"isDeveloper"] boolValue]) {
      // user-facing (not debugging).
      // additionally disable RCTRedBox
      return EXDisabledRedBox.class;
    }
  }
  return RCTCoreModulesClassProvider(name);
}

/**
 Returns a pure C++ object wrapping an exported unimodule instance.
 */
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
{
  return nullptr;
}

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
{
  // Standard
  if (moduleClass == RCTImageLoader.class) {
    return [[moduleClass alloc] initWithRedirectDelegate:nil loadersProvider:^NSArray<id<RCTImageURLLoader>> *(RCTModuleRegistry *) {
      return @[[RCTLocalAssetImageLoader new], [EXMediaLibraryImageLoader new]];
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

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                     initParams:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  // TODO: ADD
  return nullptr;
}

- (BOOL)_isOpeningHomeInProductionMode
{
  return _params[@"browserModuleClass"] && !self.manifest.developer;
}

- (void *)versionedJsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  [bridge moduleForClass:[RCTUIManager class]];
  REAUIManager *reaUiManager = [REAUIManager new];
  [reaUiManager setBridge:bridge];
  RCTUIManager *uiManager = reaUiManager;
  [bridge updateModuleWithInstance:uiManager];

  [bridge moduleForClass:[RCTEventDispatcher class]];
  RCTEventDispatcher *eventDispatcher = [REAEventDispatcher new];
  RCTCallableJSModules *callableJSModules = [RCTCallableJSModules new];
  [bridge setValue:callableJSModules forKey:@"_callableJSModules"];
  [callableJSModules setBridge:bridge];
  [eventDispatcher setValue:callableJSModules forKey:@"_callableJSModules"];
  [eventDispatcher setValue:bridge forKey:@"_bridge"];
  [eventDispatcher initialize];
  [bridge updateModuleWithInstance:eventDispatcher];

  EX_WEAKIFY(self);
  const auto executor = [EXWeak_self, bridge](facebook::jsi::Runtime &runtime) {
    if (!bridge) {
      return;
    }
    EX_ENSURE_STRONGIFY(self);
    auto reanimatedModule = reanimated::createReanimatedModule(bridge, bridge.jsCallInvoker);
    auto workletRuntimeValue = runtime
        .global()
        .getProperty(runtime, "ArrayBuffer")
        .asObject(runtime)
        .asFunction(runtime)
        .callAsConstructor(runtime, {static_cast<double>(sizeof(void*))});
    uintptr_t* workletRuntimeData = reinterpret_cast<uintptr_t*>(
        workletRuntimeValue.getObject(runtime).getArrayBuffer(runtime).data(runtime));
    workletRuntimeData[0] = reinterpret_cast<uintptr_t>(reanimatedModule->runtime.get());
    runtime.global().setProperty(
        runtime,
        "_WORKLET_RUNTIME",
        workletRuntimeValue);
    runtime.global().setProperty(
        runtime,
        "_REANIMATED_VERSION_CPP",
        reanimated::getReanimatedVersionString(runtime));

    runtime.global().setProperty(
         runtime,
         jsi::PropNameID::forAscii(runtime, "__reanimatedModuleProxy"),
         jsi::Object::createFromHostObject(runtime, reanimatedModule));
  };
  if ([self.manifest.jsEngine isEqualToString:@"hermes"]) {
    return new facebook::react::HermesExecutorFactory(RCTJSIExecutorRuntimeInstaller(executor));
  }
  return new facebook::react::JSCExecutorFactory(RCTJSIExecutorRuntimeInstaller(executor));
}

@end
