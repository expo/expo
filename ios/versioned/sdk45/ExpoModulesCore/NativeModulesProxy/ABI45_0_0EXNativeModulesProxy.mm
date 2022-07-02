// Copyright 2018-present 650 Industries. All rights reserved.

#import <objc/runtime.h>

#import <ABI45_0_0React/ABI45_0_0RCTLog.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManager.h>
#import <ABI45_0_0React/ABI45_0_0RCTComponentData.h>
#import <ABI45_0_0React/ABI45_0_0RCTModuleData.h>
#import <ABI45_0_0React/ABI45_0_0RCTEventDispatcherProtocol.h>

#import <ABI45_0_0jsi/ABI45_0_0jsi.h>

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXNativeModulesProxy.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXEventEmitter.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXViewManager.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXViewManagerAdapter.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXViewManagerAdapterClassesRegistry.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryProvider.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXReactNativeEventEmitter.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXJSIInstaller.h>
#import <ABI45_0_0ExpoModulesCore/Swift.h>

static const NSString *exportedMethodsNamesKeyPath = @"exportedMethods";
static const NSString *viewManagersMetadataKeyPath = @"viewManagersMetadata";
static const NSString *exportedConstantsKeyPath = @"modulesConstants";

static const NSString *methodInfoKeyKey = @"key";
static const NSString *methodInfoNameKey = @"name";
static const NSString *methodInfoArgumentsCountKey = @"argumentsCount";

@interface ABI45_0_0RCTBridge (RegisterAdditionalModuleClasses)

- (NSArray<ABI45_0_0RCTModuleData *> *)registerModulesForClasses:(NSArray<Class> *)moduleClasses;
- (void)registerAdditionalModuleClasses:(NSArray<Class> *)modules;

@end

@interface ABI45_0_0RCTBridge (JSIRuntime)

- (void *)runtime;

@end

@interface ABI45_0_0EXNativeModulesProxy ()

@property (nonatomic, strong) NSRegularExpression *regexp;
@property (nonatomic, strong) ABI45_0_0EXModuleRegistry *exModuleRegistry;
@property (nonatomic, strong) NSMutableDictionary<const NSString *, NSMutableDictionary<NSString *, NSNumber *> *> *exportedMethodsKeys;
@property (nonatomic, strong) NSMutableDictionary<const NSString *, NSMutableDictionary<NSNumber *, NSString *> *> *exportedMethodsReverseKeys;
@property (nonatomic) BOOL ownsModuleRegistry;

@end

@implementation ABI45_0_0EXNativeModulesProxy

@synthesize bridge = _bridge;

ABI45_0_0RCT_EXPORT_MODULE(NativeUnimoduleProxy)

/**
 The designated initializer. It's used in the old setup where the native modules proxy
 is registered in `extraModulesForBridge:` by the bridge delegate.
 */
- (instancetype)initWithModuleRegistry:(nullable ABI45_0_0EXModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _exModuleRegistry = moduleRegistry != nil ? moduleRegistry : [[ABI45_0_0EXModuleRegistryProvider new] moduleRegistry];
    _swiftInteropBridge = [[SwiftInteropBridge alloc] initWithModulesProvider:[ABI45_0_0EXNativeModulesProxy getExpoModulesProvider] legacyModuleRegistry:_exModuleRegistry];
    _exportedMethodsKeys = [NSMutableDictionary dictionary];
    _exportedMethodsReverseKeys = [NSMutableDictionary dictionary];
    _ownsModuleRegistry = moduleRegistry == nil;
  }
  return self;
}

/**
 Convenience initializer used by ABI45_0_0React Native in the new setup, where the modules are registered automatically.
 */
- (instancetype)init
{
  return [self initWithModuleRegistry:nil];
}

# pragma mark - ABI45_0_0React API

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSDictionary *)constantsToExport
{
  // Install ExpoModules host object in the runtime. It's probably not the right place,
  // but it's the earliest moment in bridge's lifecycle when we have access to the runtime.
  [self installExpoModulesHostObject];

  NSMutableDictionary <NSString *, id> *exportedModulesConstants = [NSMutableDictionary dictionary];
  // Grab all the constants exported by modules
  for (ABI45_0_0EXExportedModule *exportedModule in [_exModuleRegistry getAllExportedModules]) {
    @try {
      exportedModulesConstants[[[exportedModule class] exportedModuleName]] = [exportedModule constantsToExport] ?: [NSNull null];
    } @catch (NSException *exception) {
      continue;
    }
  }
  [exportedModulesConstants addEntriesFromDictionary:[_swiftInteropBridge exportedModulesConstants]];

  // Also add `exportedMethodsNames`
  NSMutableDictionary<const NSString *, NSMutableArray<NSMutableDictionary<const NSString *, id> *> *> *exportedMethodsNamesAccumulator = [NSMutableDictionary dictionary];
  for (ABI45_0_0EXExportedModule *exportedModule in [_exModuleRegistry getAllExportedModules]) {
    const NSString *exportedModuleName = [[exportedModule class] exportedModuleName];
    exportedMethodsNamesAccumulator[exportedModuleName] = [NSMutableArray array];
    [[exportedModule getExportedMethods] enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull exportedName, NSString * _Nonnull selectorName, BOOL * _Nonnull stop) {
      NSMutableDictionary<const NSString *, id> *methodInfo = [NSMutableDictionary dictionaryWithDictionary:@{
                                                                                                              methodInfoNameKey: exportedName,
                                                                                                              // - 3 is for resolver and rejecter of the promise and the last, empty component
                                                                                                              methodInfoArgumentsCountKey: @([[selectorName componentsSeparatedByString:@":"] count] - 3)
                                                                                                              }];
      [exportedMethodsNamesAccumulator[exportedModuleName] addObject:methodInfo];
    }];
    [self assignExportedMethodsKeys:exportedMethodsNamesAccumulator[exportedModuleName] forModuleName:exportedModuleName];
  }

  // Add entries from Swift modules
  [exportedMethodsNamesAccumulator addEntriesFromDictionary:[_swiftInteropBridge exportedFunctionNames]];

  // Also, add `viewManagersMetadata` for sanity check and testing purposes -- with names we know what managers to mock on UIManager
  NSArray<ABI45_0_0EXViewManager *> *viewManagers = [_exModuleRegistry getAllViewManagers];
  NSMutableDictionary<NSString *, NSDictionary *> *viewManagersMetadata = [[NSMutableDictionary alloc] initWithCapacity:[viewManagers count]];

  for (ABI45_0_0EXViewManager *viewManager in viewManagers) {
    viewManagersMetadata[viewManager.viewName] = @{
      @"propsNames": [[viewManager getPropsNames] allKeys]
    };
  }

  // Add entries from Swift view managers
  [viewManagersMetadata addEntriesFromDictionary:[_swiftInteropBridge viewManagersMetadata]];

  NSMutableDictionary <NSString *, id> *constantsAccumulator = [NSMutableDictionary dictionary];
  constantsAccumulator[viewManagersMetadataKeyPath] = viewManagersMetadata;
  constantsAccumulator[exportedConstantsKeyPath] = exportedModulesConstants;
  constantsAccumulator[exportedMethodsNamesKeyPath] = exportedMethodsNamesAccumulator;

  return constantsAccumulator;
}

- (void)setBridge:(ABI45_0_0RCTBridge *)bridge
{
  if (!_bridge) {
    // The `setBridge` can be called during module setup or after. Registering more modules
    // during setup causes a crash due to mutating `_moduleDataByID` while it's being enumerated.
    // In that case we register them asynchronously.
    if ([[bridge valueForKey:@"_moduleSetupComplete"] boolValue]) {
      [self registerExpoModulesInBridge:bridge];
    } else {
      dispatch_async(dispatch_get_main_queue(), ^{
        [self registerExpoModulesInBridge:bridge];
      });
    }
  }
  [_swiftInteropBridge setReactBridge:bridge];
  _bridge = bridge;
}

ABI45_0_0RCT_EXPORT_METHOD(callMethod:(NSString *)moduleName methodNameOrKey:(id)methodNameOrKey arguments:(NSArray *)arguments resolver:(ABI45_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI45_0_0RCTPromiseRejectBlock)reject)
{
  if ([_swiftInteropBridge hasModule:moduleName]) {
    [_swiftInteropBridge callFunction:methodNameOrKey onModule:moduleName withArgs:arguments resolve:resolve reject:reject];
    return;
  }
  ABI45_0_0EXExportedModule *module = [_exModuleRegistry getExportedModuleForName:moduleName];
  if (module == nil) {
    NSString *reason = [NSString stringWithFormat:@"No exported module was found for name '%@'. Are you sure all the packages are linked correctly?", moduleName];
    reject(@"E_NO_MODULE", reason, nil);
    return;
  }

  if (!methodNameOrKey) {
    reject(@"E_NO_METHOD", @"No method key or name provided", nil);
    return;
  }

  NSString *methodName;
  if ([methodNameOrKey isKindOfClass:[NSString class]]) {
    methodName = (NSString *)methodNameOrKey;
  } else if ([methodNameOrKey isKindOfClass:[NSNumber class]]) {
    methodName = _exportedMethodsReverseKeys[moduleName][(NSNumber *)methodNameOrKey];
  } else {
    reject(@"E_INV_MKEY", @"Method key is neither a String nor an Integer -- don't know how to map it to method name.", nil);
    return;
  }

  dispatch_async([module methodQueue], ^{
    @try {
      [module callExportedMethod:methodName withArguments:arguments resolver:resolve rejecter:reject];
    } @catch (NSException *e) {
      NSString *message = [NSString stringWithFormat:@"An exception was thrown while calling `%@.%@` with arguments `%@`: %@", moduleName, methodName, arguments, e];
      reject(@"E_EXC", message, nil);
    }
  });
}

- (id)callMethodSync:(NSString *)moduleName methodName:(NSString *)methodName arguments:(NSArray *)arguments
{
  if ([_swiftInteropBridge hasModule:moduleName]) {
    return [_swiftInteropBridge callFunctionSync:methodName onModule:moduleName withArgs:arguments];
  }
  return (id)kCFNull;
}

#pragma mark - Statics

+ (ModulesProvider *)getExpoModulesProvider
{
  // Dynamically gets the modules provider class.
  // NOTE: This needs to be versioned in Expo Go.
  Class generatedExpoModulesProvider;

  // [0] When ExpoModulesCore is built as separated framework/module,
  // we should explicitly load main bundle's `ExpoModulesProvider` class.
  NSString *bundleName = NSBundle.mainBundle.infoDictionary[@"CFBundleName"];
  if (bundleName != nil) {
    generatedExpoModulesProvider = NSClassFromString([NSString stringWithFormat:@"%@.ABI45_0_0ExpoModulesProvider", bundleName]);
    if (generatedExpoModulesProvider != nil) {
      return [generatedExpoModulesProvider new];
    }
  }

  // [1] Fallback to load `ExpoModulesProvider` class from the current module.
  generatedExpoModulesProvider = NSClassFromString(@"ABI45_0_0ExpoModulesProvider");
  if (generatedExpoModulesProvider != nil) {
    return [generatedExpoModulesProvider new];
  }

  // [2] Fallback to load `ModulesProvider` if `ExpoModulesProvider` was not generated
  return [ModulesProvider new];
}

#pragma mark - Privates

- (void)registerExpoModulesInBridge:(ABI45_0_0RCTBridge *)bridge
{
  // Registering expo modules (excluding Swifty view managers!) in bridge is needed only when the proxy module owns
  // the registry (was autoinitialized by ABI45_0_0React Native). Otherwise they're registered by the registry adapter.
  BOOL ownsModuleRegistry = _ownsModuleRegistry && ![bridge moduleIsInitialized:[ABI45_0_0EXReactNativeEventEmitter class]];

  // An array of `ABI45_0_0RCTBridgeModule` classes to register.
  NSMutableArray<Class<ABI45_0_0RCTBridgeModule>> *additionalModuleClasses = [NSMutableArray new];
  NSMutableSet *visitedSweetModules = [NSMutableSet new];

  // Add dynamic wrappers for view modules written in Sweet API.
  for (ViewModuleWrapper *swiftViewModule in [_swiftInteropBridge getViewManagers]) {
    Class wrappedViewModuleClass = [self registerComponentData:swiftViewModule inBridge:bridge];
    [additionalModuleClasses addObject:wrappedViewModuleClass];
    [visitedSweetModules addObject:swiftViewModule.name];
  }

  [additionalModuleClasses addObject:[ViewModuleWrapper class]];
  [self registerLegacyComponentData:[ViewModuleWrapper class] inBridge:bridge];

  // Add modules from legacy module registry only when the NativeModulesProxy owns the registry.
  if (ownsModuleRegistry) {
    // Event emitter is a bridge module, however it's also needed by expo modules,
    // so later we'll register an instance created by ABI45_0_0React Native as expo module.
    [additionalModuleClasses addObject:[ABI45_0_0EXReactNativeEventEmitter class]];

    // Add dynamic wrappers for the classic view managers.
    for (ABI45_0_0EXViewManager *viewManager in [_exModuleRegistry getAllViewManagers]) {
      if (![visitedSweetModules containsObject:viewManager.viewName]) {
        Class viewManagerWrapperClass = [ABI45_0_0EXViewManagerAdapterClassesRegistry createViewManagerAdapterClassForViewManager:viewManager];
        [additionalModuleClasses addObject:viewManagerWrapperClass];
        [self registerLegacyComponentData:viewManagerWrapperClass inBridge:bridge];
      }
    }

    // View manager wrappers don't have their own prop configs, so we must register
    // their base view managers that provides common props such as `proxiedProperties`.
    // Otherwise, ABI45_0_0React Native may treat these props as invalid in subclassing views.
    [additionalModuleClasses addObject:[ABI45_0_0EXViewManagerAdapter class]];

    // Some modules might need access to the bridge.
    for (id module in [_exModuleRegistry getAllInternalModules]) {
      if ([module conformsToProtocol:@protocol(ABI45_0_0RCTBridgeModule)]) {
        [module setValue:bridge forKey:@"bridge"];
      }
    }
  }

  // `registerAdditionalModuleClasses:` call below is not thread-safe if ABI45_0_0RCTUIManager is not initialized.
  // The case happens especially with reanimated which accesses `bridge.uiManager` and initialize bridge in js thread.
  // Accessing uiManager here, we try to make sure ABI45_0_0RCTUIManager is initialized.
  [bridge uiManager];

  // Register the view managers as additional modules.
  [self registerAdditionalModuleClasses:additionalModuleClasses inBridge:bridge];

  // Get the instance of `ABI45_0_0EXReactEventEmitter` bridge module and give it access to the interop bridge.
  ABI45_0_0EXReactNativeEventEmitter *eventEmitter = [bridge moduleForClass:[ABI45_0_0EXReactNativeEventEmitter class]];
  [eventEmitter setSwiftInteropBridge:_swiftInteropBridge];

  // As the last step, when the registry is owned,
  // register the event emitter and initialize the registry.
  if (ownsModuleRegistry) {
    [_exModuleRegistry registerInternalModule:eventEmitter];

    // Let the modules consume the registry :)
    // It calls `setModuleRegistry:` on all `ABI45_0_0EXModuleRegistryConsumer`s.
    [_exModuleRegistry initialize];
  }
}

- (void)registerAdditionalModuleClasses:(NSArray<Class> *)moduleClasses inBridge:(ABI45_0_0RCTBridge *)bridge
{
  // In remote debugging mode, i.e. executorClass is `ABI45_0_0RCTWebSocketExecutor`,
  // there is a deadlock issue in `registerAdditionalModuleClasses:` and causes app freezed.
  //   - The JS thread acquired the `ABI45_0_0RCTCxxBridge._moduleRegistryLock` lock in `ABI45_0_0RCTCxxBridge._initializeBridgeLocked`
  //      = it further goes into ABI45_0_0RCTObjcExecutor and tries to get module config from main thread
  //   - The main thread is pending in `ABI45_0_0RCTCxxBridge.registerAdditionalModuleClasses` where trying to acquire the same lock.
  // To workaround the deadlock, we tend to use the non-locked registration and mutate the bridge internal module data.
  // Since JS thread in this situation is waiting for main thread, it's safe to mutate module data without lock.
  // The only risk should be the internal `_moduleRegistryCreated` flag without lock protection.
  // As we just workaround in `ABI45_0_0RCTWebSocketExecutor` case, the risk of `_moduleRegistryCreated` race condition should be lower.
  //
  // Learn more about the non-locked initialization:
  // https://github.com/facebook/react-native/blob/757bb75fbf837714725d7b2af62149e8e2a7ee51/ABI45_0_0React/CxxBridge/ABI45_0_0RCTCxxBridge.mm#L922-L935
  // See the `_moduleRegistryCreated` false case
  if ([NSStringFromClass([bridge executorClass]) isEqualToString:@"ABI45_0_0RCTWebSocketExecutor"]) {
    NSNumber *moduleRegistryCreated = [bridge valueForKey:@"_moduleRegistryCreated"];
    if (![moduleRegistryCreated boolValue]) {
      [bridge registerModulesForClasses:moduleClasses];
      return;
    }
  }

  [bridge registerAdditionalModuleClasses:moduleClasses];
}

- (Class)registerComponentData:(ViewModuleWrapper *)viewModule inBridge:(ABI45_0_0RCTBridge *)bridge
{
  // Hacky way to get a dictionary with `ABI45_0_0RCTComponentData` from UIManager.
  NSMutableDictionary<NSString *, ABI45_0_0RCTComponentData *> *componentDataByName = [bridge.uiManager valueForKey:@"_componentDataByName"];
  Class wrappedViewModuleClass = [ViewModuleWrapper createViewModuleWrapperClassWithModule:viewModule];
  NSString *className = NSStringFromClass(wrappedViewModuleClass);

  if (componentDataByName[className]) {
    // Just in case the component was already registered, let's leave a log that we're overriding it.
    NSLog(@"Overriding ComponentData for view %@", className);
  }

  ABI45_0_0EXComponentData *componentData = [[ABI45_0_0EXComponentData alloc] initWithViewModule:viewModule
                                                                  managerClass:wrappedViewModuleClass
                                                                        bridge:bridge];
  componentDataByName[className] = componentData;
  return wrappedViewModuleClass;
}

/**
 Bridge's `registerAdditionalModuleClasses:` method doesn't register
 components in UIManager — we need to register them on our own.
 */
- (void)registerLegacyComponentData:(Class)moduleClass inBridge:(ABI45_0_0RCTBridge *)bridge
{
  // Hacky way to get a dictionary with `ABI45_0_0RCTComponentData` from UIManager.
  NSMutableDictionary<NSString *, ABI45_0_0RCTComponentData *> *componentDataByName = [bridge.uiManager valueForKey:@"_componentDataByName"];
  NSString *className = NSStringFromClass(moduleClass);

  if ([moduleClass isSubclassOfClass:[ABI45_0_0RCTViewManager class]] && !componentDataByName[className]) {
    ABI45_0_0RCTComponentData *componentData = [[ABI45_0_0RCTComponentData alloc] initWithManagerClass:moduleClass bridge:bridge eventDispatcher:bridge.eventDispatcher];
    componentDataByName[className] = componentData;
  }
}

- (void)assignExportedMethodsKeys:(NSMutableArray<NSMutableDictionary<const NSString *, id> *> *)exportedMethods forModuleName:(const NSString *)moduleName
{
  if (!_exportedMethodsKeys[moduleName]) {
    _exportedMethodsKeys[moduleName] = [NSMutableDictionary dictionary];
  }

  if (!_exportedMethodsReverseKeys[moduleName]) {
    _exportedMethodsReverseKeys[moduleName] = [NSMutableDictionary dictionary];
  }

  for (int i = 0; i < [exportedMethods count]; i++) {
    NSMutableDictionary<const NSString *, id> *methodInfo = exportedMethods[i];

    if (!methodInfo[(NSString *)methodInfoNameKey] || ![methodInfo[methodInfoNameKey] isKindOfClass:[NSString class]]) {
      NSString *reason = [NSString stringWithFormat:@"Method info of a method of module %@ has no method name.", moduleName];
      @throw [NSException exceptionWithName:@"Empty method name in method info" reason:reason userInfo:nil];
    }

    NSString *methodName = methodInfo[(NSString *)methodInfoNameKey];
    NSNumber *previousMethodKey = _exportedMethodsKeys[moduleName][methodName];
    if (previousMethodKey) {
      methodInfo[methodInfoKeyKey] = previousMethodKey;
    } else {
      NSNumber *newKey = @([[_exportedMethodsKeys[moduleName] allValues] count]);
      methodInfo[methodInfoKeyKey] = newKey;
      _exportedMethodsKeys[moduleName][methodName] = newKey;
      _exportedMethodsReverseKeys[moduleName][newKey] = methodName;
    }
  }
}

/**
 Installs ExpoModules host object in the runtime that the current bridge operates on.
 */
- (void)installExpoModulesHostObject
{
  ABI45_0_0facebook::jsi::Runtime *jsiRuntime = [_bridge respondsToSelector:@selector(runtime)] ? reinterpret_cast<ABI45_0_0facebook::jsi::Runtime *>(_bridge.runtime) : nullptr;

  if (jsiRuntime) {
    ABI45_0_0EXJavaScriptRuntime *runtime = [[ABI45_0_0EXJavaScriptRuntime alloc] initWithRuntime:jsiRuntime callInvoker:_bridge.jsCallInvoker];

    [ABI45_0_0EXJavaScriptRuntimeManager installExpoModulesToRuntime:runtime withSwiftInterop:_swiftInteropBridge];
    [_swiftInteropBridge setRuntime:runtime];
  }
}

@end
