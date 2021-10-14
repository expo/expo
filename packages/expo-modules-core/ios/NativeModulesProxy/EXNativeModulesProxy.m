// Copyright 2018-present 650 Industries. All rights reserved.

#import <objc/runtime.h>

#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTComponentData.h>
#import <React/RCTModuleData.h>
#import <React/RCTEventDispatcherProtocol.h>

#import <ExpoModulesCore/EXNativeModulesProxy.h>
#import <ExpoModulesCore/EXEventEmitter.h>
#import <ExpoModulesCore/EXViewManager.h>
#import <ExpoModulesCore/EXViewManagerAdapter.h>
#import <ExpoModulesCore/EXViewManagerAdapterClassesRegistry.h>
#import <ExpoModulesCore/EXModuleRegistryProvider.h>
#import <ExpoModulesCore/EXReactNativeEventEmitter.h>
#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
// For cocoapods framework, the generated swift header will be inside ExpoModulesCore module
#import <ExpoModulesCore/ExpoModulesCore-Swift.h>
#else
#import "ExpoModulesCore-Swift.h"
#endif

static const NSString *exportedMethodsNamesKeyPath = @"exportedMethods";
static const NSString *viewManagersNamesKeyPath = @"viewManagersNames";
static const NSString *exportedConstantsKeyPath = @"modulesConstants";

static const NSString *methodInfoKeyKey = @"key";
static const NSString *methodInfoNameKey = @"name";
static const NSString *methodInfoArgumentsCountKey = @"argumentsCount";

@interface RCTBridge (RegisterAdditionalModuleClasses)

- (void)registerAdditionalModuleClasses:(NSArray<Class> *)modules;

@end

@interface RCTComponentData (EXNativeModulesProxy)

- (instancetype)initWithManagerClass:(Class)managerClass bridge:(RCTBridge *)bridge eventDispatcher:(id<RCTEventDispatcherProtocol>) eventDispatcher; // available in RN 0.65+
- (instancetype)initWithManagerClass:(Class)managerClass bridge:(RCTBridge *)bridge;

@end

@interface EXNativeModulesProxy ()

@property (nonatomic, strong) NSRegularExpression *regexp;
@property (nonatomic, strong) EXModuleRegistry *exModuleRegistry;
@property (nonatomic, strong) NSMutableDictionary<const NSString *, NSMutableDictionary<NSString *, NSNumber *> *> *exportedMethodsKeys;
@property (nonatomic, strong) NSMutableDictionary<const NSString *, NSMutableDictionary<NSNumber *, NSString *> *> *exportedMethodsReverseKeys;
@property (nonatomic) BOOL ownsModuleRegistry;

@end

@implementation EXNativeModulesProxy

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(NativeUnimoduleProxy)

/**
 The designated initializer. It's used in the old setup where the native modules proxy
 is registered in `extraModulesForBridge:` by the bridge delegate.
 */
- (instancetype)initWithModuleRegistry:(nullable EXModuleRegistry *)moduleRegistry
{
  if (self = [super init]) {
    _exModuleRegistry = moduleRegistry != nil ? moduleRegistry : [[EXModuleRegistryProvider new] moduleRegistry];
    _swiftInteropBridge = [[SwiftInteropBridge alloc] initWithModulesProvider:[self getExpoModulesProvider] legacyModuleRegistry:_exModuleRegistry];
    _exportedMethodsKeys = [NSMutableDictionary dictionary];
    _exportedMethodsReverseKeys = [NSMutableDictionary dictionary];
    _ownsModuleRegistry = moduleRegistry == nil;
  }
  return self;
}

/**
 Convenience initializer used by React Native in the new setup, where the modules are registered automatically.
 */
- (instancetype)init
{
  return [self initWithModuleRegistry:nil];
}

# pragma mark - React API

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSDictionary *)constantsToExport
{
  NSMutableDictionary <NSString *, id> *exportedModulesConstants = [NSMutableDictionary dictionary];
  // Grab all the constants exported by modules
  for (EXExportedModule *exportedModule in [_exModuleRegistry getAllExportedModules]) {
    @try {
      exportedModulesConstants[[[exportedModule class] exportedModuleName]] = [exportedModule constantsToExport] ?: [NSNull null];
    } @catch (NSException *exception) {
      continue;
    }
  }
  [exportedModulesConstants addEntriesFromDictionary:[_swiftInteropBridge exportedModulesConstants]];

  // Also add `exportedMethodsNames`
  NSMutableDictionary<const NSString *, NSMutableArray<NSMutableDictionary<const NSString *, id> *> *> *exportedMethodsNamesAccumulator = [NSMutableDictionary dictionary];
  for (EXExportedModule *exportedModule in [_exModuleRegistry getAllExportedModules]) {
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
  [exportedMethodsNamesAccumulator addEntriesFromDictionary:[_swiftInteropBridge exportedMethodNames]];

  // Also, add `viewManagersNames` for sanity check and testing purposes -- with names we know what managers to mock on UIManager
  NSArray<EXViewManager *> *viewManagers = [_exModuleRegistry getAllViewManagers];
  NSMutableArray<NSString *> *viewManagersNames = [NSMutableArray arrayWithCapacity:[viewManagers count]];
  for (EXViewManager *viewManager in viewManagers) {
    [viewManagersNames addObject:[viewManager viewName]];
  }

  [viewManagersNames addObjectsFromArray:[_swiftInteropBridge exportedViewManagersNames]];

  NSMutableDictionary <NSString *, id> *constantsAccumulator = [NSMutableDictionary dictionary];
  constantsAccumulator[viewManagersNamesKeyPath] = viewManagersNames;
  constantsAccumulator[exportedConstantsKeyPath] = exportedModulesConstants;
  constantsAccumulator[exportedMethodsNamesKeyPath] = exportedMethodsNamesAccumulator;

  return constantsAccumulator;
}

- (void)setBridge:(RCTBridge *)bridge
{
  if (!_bridge) {
    [self registerExpoModulesInBridge:bridge];
  }
  _bridge = bridge;
}

RCT_EXPORT_METHOD(callMethod:(NSString *)moduleName methodNameOrKey:(id)methodNameOrKey arguments:(NSArray *)arguments resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if ([_swiftInteropBridge hasModule:moduleName]) {
    [_swiftInteropBridge callMethod:methodNameOrKey onModule:moduleName withArgs:arguments resolve:resolve reject:reject];
    return;
  }
  EXExportedModule *module = [_exModuleRegistry getExportedModuleForName:moduleName];
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

#pragma mark - Privates

- (id<ModulesProviderObjCProtocol>)getExpoModulesProvider
{
  Class generatedExpoModulesProvider = NSClassFromString(@"ExpoModulesProvider");
  // Checks if `ExpoModulesProvider` was generated
  if (generatedExpoModulesProvider) {
    return [generatedExpoModulesProvider new];
  } else {
    return [ModulesProvider new];
  }
}

- (void)registerExpoModulesInBridge:(RCTBridge *)bridge
{
  // Registering expo modules in bridge is needed only when the proxy module owns the registry
  // (was autoinitialized by React Native). Otherwise they're registered by the registry adapter.
  if (!_ownsModuleRegistry || [bridge moduleIsInitialized:[EXReactNativeEventEmitter class]]) {
    return;
  }

  // An array of `RCTBridgeModule` classes to register.
  NSMutableArray<Class<RCTBridgeModule>> *additionalModuleClasses = [NSMutableArray new];
  NSMutableSet *visitedSweetModules = [NSMutableSet new];

  // Event emitter is a bridge module, however it's also needed by expo modules,
  // so later we'll register an instance created by React Native as expo module.
  [additionalModuleClasses addObject:[EXReactNativeEventEmitter class]];

  // Add dynamic wrappers for view modules written in Sweet API.
  for (ViewModuleWrapper *swiftViewModule in [_swiftInteropBridge getViewManagers]) {
    Class wrappedViewModuleClass = [ViewModuleWrapper createViewModuleWrapperClassWithModule:swiftViewModule];
    [additionalModuleClasses addObject:wrappedViewModuleClass];
    [visitedSweetModules addObject:swiftViewModule.name];
  }

  // Add dynamic wrappers for the classic view managers.
  for (EXViewManager *viewManager in [_exModuleRegistry getAllViewManagers]) {
    if (![visitedSweetModules containsObject:viewManager.viewName]) {
      Class viewManagerWrapperClass = [EXViewManagerAdapterClassesRegistry createViewManagerAdapterClassForViewManager:viewManager];
      [additionalModuleClasses addObject:viewManagerWrapperClass];
    }
  }

  // View manager wrappers don't have their own prop configs, so we must register
  // their base view managers that provides common props such as `proxiedProperties`.
  // Otherwise, React Native may treat these props as invalid in subclassing views.
  [additionalModuleClasses addObject:[EXViewManagerAdapter class]];
  [additionalModuleClasses addObject:[ViewModuleWrapper class]];

  // Some modules might need access to the bridge.
  for (id module in [_exModuleRegistry getAllInternalModules]) {
    if ([module conformsToProtocol:@protocol(RCTBridgeModule)]) {
      [module setValue:bridge forKey:@"bridge"];
    }
  }

  // `registerAdditionalModuleClasses:` call below is not thread-safe if RCTUIManager is not initialized.
  // The case happens especially with reanimated which accesses `bridge.uiManager` and initialize bridge in js thread.
  // Accessing uiManager here, we try to make sure RCTUIManager is initialized.
  [bridge uiManager];

  // Register the view managers as additional modules.
  [bridge registerAdditionalModuleClasses:additionalModuleClasses];

  // Bridge's `registerAdditionalModuleClasses:` method doesn't register
  // components in UIManager — we need to register them on our own.
  [self registerComponentDataForModuleClasses:additionalModuleClasses inBridge:bridge];

  // Get the newly created instance of `EXReactEventEmitter` bridge module and register it in expo modules registry.
  EXReactNativeEventEmitter *eventEmitter = [bridge moduleForClass:[EXReactNativeEventEmitter class]];
  [_exModuleRegistry registerInternalModule:eventEmitter];

  // Let the modules consume the registry :)
  // It calls `setModuleRegistry:` on all `EXModuleRegistryConsumer`s.
  [_exModuleRegistry initialize];
}

- (void)registerComponentDataForModuleClasses:(NSArray<Class> *)moduleClasses inBridge:(RCTBridge *)bridge
{
  // Hacky way to get a dictionary with `RCTComponentData` from UIManager.
  NSMutableDictionary<NSString *, RCTComponentData *> *componentDataByName = [bridge.uiManager valueForKey:@"_componentDataByName"];

  // Register missing components data for all view managers.
  for (Class moduleClass in moduleClasses) {
    NSString *className = NSStringFromClass(moduleClass);

    if ([moduleClass isSubclassOfClass:[RCTViewManager class]] && !componentDataByName[className]) {
      RCTComponentData *componentData = [RCTComponentData alloc];
      if ([componentData respondsToSelector:@selector(initWithManagerClass:bridge:eventDispatcher:)]) {
        // Init method was changed in RN 0.65
        [componentData initWithManagerClass:moduleClass bridge:bridge eventDispatcher:bridge.eventDispatcher];
      } else {
        // fallback for older RNs
        [componentData initWithManagerClass:moduleClass bridge:bridge];
      }
      
      componentDataByName[className] = componentData;
    }
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

@end
