// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXNativeModulesProxy.h>
#import <ExpoModulesCore/EXViewManagerAdapter.h>
#import <ExpoModulesCore/EXModuleRegistryAdapter.h>
#import <ExpoModulesCore/EXModuleRegistryProvider.h>
#import <ExpoModulesCore/EXViewManagerAdapterClassesRegistry.h>
#import <ExpoModulesCore/EXModuleRegistryHolderReactModule.h>
#import <ExpoModulesCore/EXReactNativeEventEmitter.h>

@interface EXModuleRegistryAdapter ()

@property (nonatomic, strong) EXModuleRegistryProvider *moduleRegistryProvider;
@property (nonatomic, strong) EXViewManagerAdapterClassesRegistry *viewManagersClassesRegistry;

@end

@implementation EXModuleRegistryAdapter

- (instancetype)initWithModuleRegistryProvider:(EXModuleRegistryProvider *)moduleRegistryProvider
{
  if (self = [super init]) {
    _moduleRegistryProvider = moduleRegistryProvider;
    _viewManagersClassesRegistry = [[EXViewManagerAdapterClassesRegistry alloc] init];
  }
  return self;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  return [self extraModulesForModuleRegistry:[_moduleRegistryProvider moduleRegistry]];
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  NSMutableArray<id<RCTBridgeModule>> *extraModules = [NSMutableArray array];

  EXNativeModulesProxy *nativeModulesProxy = [[EXNativeModulesProxy alloc] initWithModuleRegistry:moduleRegistry];
  [extraModules addObject:nativeModulesProxy];

  // Event emitter is not automatically registered — we add it to the module registry here.
  // It will be added to the bridge later in this method, as it conforms to `RCTBridgeModule`.
  EXReactNativeEventEmitter *eventEmitter = [EXReactNativeEventEmitter new];
  [moduleRegistry registerInternalModule:eventEmitter];

  for (EXViewManager *viewManager in [moduleRegistry getAllViewManagers]) {
    Class viewManagerAdapterClass = [EXViewManagerAdapterClassesRegistry createViewManagerAdapterClassForViewManager:viewManager];
    [extraModules addObject:[[viewManagerAdapterClass alloc] init]];
  }

  // Silence React Native warning `Base module "%s" does not exist`
  // occurring when view manager class is subclassing another class
  // that is not RCTViewManager (in our case all the view manager adapters
  // subclass EXViewManagerAdapter, so RN expects to find EXViewManagerAdapter
  // exported.
  [extraModules addObject:[[EXViewManagerAdapter alloc] init]];

  // It is possible that among internal modules there are some RCTBridgeModules --
  // let's add them to extraModules here.
  for (id<EXInternalModule> module in [moduleRegistry getAllInternalModules]) {
    if ([module conformsToProtocol:@protocol(RCTBridgeModule)]) {
      id<RCTBridgeModule> reactBridgeModule = (id<RCTBridgeModule>)module;
      [extraModules addObject:reactBridgeModule];
    }
  }
  
  // Adding the way to access the module registry from RCTBridgeModules.
  [extraModules addObject:[[EXModuleRegistryHolderReactModule alloc] initWithModuleRegistry:moduleRegistry]];

  // One could add some modules to the Module Registry after creating it.
  // Here is our last call for finalizing initialization.
  [moduleRegistry initialize];
  return extraModules;
}

@end
