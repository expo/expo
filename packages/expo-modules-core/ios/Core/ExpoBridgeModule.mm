// Copyright 2024-present 650 Industries. All rights reserved.

#import <React/RCTComponentViewFactory.h>
#import <React/RCTUIManager.h>
#import <React/RCTModuleData.h>
#import <ReactCommon/RCTTurboModule.h>

#import <ExpoModulesCore/ExpoBridgeModule.h>
#import <ExpoModulesCore/Swift.h>

@interface RCTBridge (RegisterAdditionalModuleClasses)

- (NSArray<RCTModuleData *> *)registerModulesForClasses:(NSArray<Class> *)moduleClasses;
- (void)registerAdditionalModuleClasses:(NSArray<Class> *)modules;

@end

@implementation ExpoBridgeModule

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(ExpoModulesCore);

- (instancetype)init
{
  if (self = [super init]) {
    _appContext = [[EXAppContext alloc] init];
  }
  return self;
}

- (instancetype)initWithAppContext:(EXAppContext *) appContext
{
  if (self = [super init]) {
    _appContext = appContext;
  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  // We do want to run the initialization (`setBridge`) on the JS thread.
  return NO;
}

- (void)setBridge:(RCTBridge *)bridge
{
  // As of React Native 0.74 with the New Architecture enabled,
  // it's actually an instance of `RCTBridgeProxy` that provides backwards compatibility.
  // Also, hold on with initializing the runtime until `setRuntimeExecutor` is called.
  _bridge = bridge;
  _appContext.reactBridge = bridge;

  _appContext._runtime = [EXJavaScriptRuntimeManager runtimeFromBridge:bridge];

  dispatch_async(dispatch_get_main_queue(), ^{
    [self registerExpoModulesInBridge:bridge];
  });
}

- (void)registerExpoModulesInBridge:(RCTBridge *)bridge
{
  // An array of `RCTBridgeModule` classes to register.
  NSMutableArray<Class<RCTBridgeModule>> *additionalModuleClasses = [NSMutableArray new];
  NSMutableSet *visitedSweetModules = [NSMutableSet new];

  // Add dynamic wrappers for view modules written in Sweet API.
  for (ViewModuleWrapper *swiftViewModule in [_appContext getViewManagers]) {
    Class wrappedViewModuleClass = [self registerComponentData:swiftViewModule
                                                      inBridge:bridge
                                                      forAppId:_appContext.appIdentifier];
    [additionalModuleClasses addObject:wrappedViewModuleClass];
    [visitedSweetModules addObject:swiftViewModule.name];
  }

  [additionalModuleClasses addObject:[ViewModuleWrapper class]];
  [self registerLegacyComponentData:[ViewModuleWrapper class] inBridge:bridge];

  // Add modules from legacy module registry only when the NativeModulesProxy owns the registry.
  // Some modules might need access to the bridge.
  for (id module in [_appContext.legacyModuleRegistry getAllInternalModules]) {
    if ([module conformsToProtocol:@protocol(RCTBridgeModule)]) {
      [module setValue:bridge forKey:@"bridge"];
    }
  }

  // `registerAdditionalModuleClasses:` call below is not thread-safe if RCTUIManager is not initialized.
  // The case happens especially with reanimated which accesses `bridge.uiManager` and initialize bridge in js thread.
  // Accessing uiManager here, we try to make sure RCTUIManager is initialized.
  [bridge uiManager];

  // Register the view managers as additional modules.
  [self registerAdditionalModuleClasses:additionalModuleClasses inBridge:bridge];

  // Get the instance of `EXReactEventEmitter` bridge module and give it access to the interop bridge.
  EXReactNativeEventEmitter *eventEmitter = [bridge moduleForClass:[EXReactNativeEventEmitter class]];
  [eventEmitter setAppContext:_appContext];

  // As the last step, when the registry is owned,
  // register the event emitter and initialize the registry.
  [_appContext.legacyModuleRegistry registerInternalModule:eventEmitter];

  // Let the modules consume the registry :)
  // It calls `setModuleRegistry:` on all `EXModuleRegistryConsumer`s.
  [_appContext.legacyModuleRegistry initialize];
}

- (void)registerAdditionalModuleClasses:(NSArray<Class> *)moduleClasses inBridge:(RCTBridge *)bridge
{
  if (bridge.isLoading) {
    [bridge registerModulesForClasses:moduleClasses];
  } else {
    [bridge registerAdditionalModuleClasses:moduleClasses];
  }
}

- (Class)registerComponentData:(ViewModuleWrapper *)viewModule inBridge:(RCTBridge *)bridge forAppId:(NSString *)appId
{
  // Hacky way to get a dictionary with `RCTComponentData` from UIManager.
  NSMutableDictionary<NSString *, RCTComponentData *> *componentDataByName = [[bridge uiManager] valueForKey:@"_componentDataByName"];

  Class wrappedViewModuleClass = [ViewModuleWrapper createViewModuleWrapperClassWithModule:viewModule appId:appId];
  NSString *className = NSStringFromClass(wrappedViewModuleClass);

  if (componentDataByName[className]) {
    // Just in case the component was already registered, let's leave a log that we're overriding it.
    NSLog(@"Overriding ComponentData for view %@", className);
  }

  EXComponentData *componentData = [[EXComponentData alloc] initWithViewModule:viewModule
                                                                  managerClass:wrappedViewModuleClass
                                                                        bridge:bridge];
  componentDataByName[className] = componentData;

#ifdef RCT_NEW_ARCH_ENABLED
  Class viewClass = [ExpoFabricView makeViewClassForAppContext:_appContext moduleName:[viewModule moduleName] viewName: [viewModule viewName] className:className];
  [[RCTComponentViewFactory currentComponentViewFactory] registerComponentViewClass:viewClass];
#endif

  return wrappedViewModuleClass;
}

/**
 Bridge's `registerAdditionalModuleClasses:` method doesn't register
 components in UIManager — we need to register them on our own.
 */
- (void)registerLegacyComponentData:(Class)moduleClass inBridge:(RCTBridge *)bridge
{
  // Hacky way to get a dictionary with `RCTComponentData` from UIManager.
  NSMutableDictionary<NSString *, RCTComponentData *> *componentDataByName = [bridge.uiManager valueForKey:@"_componentDataByName"];
  NSString *className = [moduleClass moduleName] ?: NSStringFromClass(moduleClass);

  if ([moduleClass isSubclassOfClass:[RCTViewManager class]] && !componentDataByName[className]) {
    RCTComponentData *componentData = [[RCTComponentData alloc] initWithManagerClass:moduleClass bridge:bridge eventDispatcher:bridge.eventDispatcher];
    componentDataByName[className] = componentData;
  }
}

#pragma mark - Exports

/**
 A synchronous method that is called from JS before requiring
 any module to ensure that all necessary bindings are installed.
 */
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(installModules)
{
  if (_bridge && !_appContext._runtime) {
    // TODO: Keep this condition until we remove the other way of installing modules.
    // See `setBridge` method above.
    _appContext._runtime = [EXJavaScriptRuntimeManager runtimeFromBridge:_bridge];
  }
  return nil;
}

@end
