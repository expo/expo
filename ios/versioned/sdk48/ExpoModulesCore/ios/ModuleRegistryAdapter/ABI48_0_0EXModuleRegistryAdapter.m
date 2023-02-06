// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXNativeModulesProxy.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXViewManagerAdapter.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryAdapter.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryProvider.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXViewManagerAdapterClassesRegistry.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryHolderReactModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXReactNativeEventEmitter.h>

@interface ABI48_0_0EXModuleRegistryAdapter ()

@property (nonatomic, strong) ABI48_0_0EXModuleRegistryProvider *moduleRegistryProvider;
@property (nonatomic, strong) ABI48_0_0EXViewManagerAdapterClassesRegistry *viewManagersClassesRegistry;

@end

@implementation ABI48_0_0EXModuleRegistryAdapter

- (instancetype)initWithModuleRegistryProvider:(ABI48_0_0EXModuleRegistryProvider *)moduleRegistryProvider
{
  if (self = [super init]) {
    _moduleRegistryProvider = moduleRegistryProvider;
    _viewManagersClassesRegistry = [[ABI48_0_0EXViewManagerAdapterClassesRegistry alloc] init];
  }
  return self;
}

- (NSArray<id<ABI48_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI48_0_0RCTBridge *)bridge
{
  return [self extraModulesForModuleRegistry:[_moduleRegistryProvider moduleRegistry]];
}

- (NSArray<id<ABI48_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI48_0_0EXModuleRegistry *)moduleRegistry
{
  NSMutableArray<id<ABI48_0_0RCTBridgeModule>> *extraModules = [NSMutableArray array];

  ABI48_0_0EXNativeModulesProxy *nativeModulesProxy = [[ABI48_0_0EXNativeModulesProxy alloc] initWithModuleRegistry:moduleRegistry];
  [extraModules addObject:nativeModulesProxy];

  // Event emitter is not automatically registered — we add it to the module registry here.
  // It will be added to the bridge later in this method, as it conforms to `ABI48_0_0RCTBridgeModule`.
  ABI48_0_0EXReactNativeEventEmitter *eventEmitter = [ABI48_0_0EXReactNativeEventEmitter new];
  [moduleRegistry registerInternalModule:eventEmitter];

  for (ABI48_0_0EXViewManager *viewManager in [moduleRegistry getAllViewManagers]) {
    Class viewManagerAdapterClass = [ABI48_0_0EXViewManagerAdapterClassesRegistry createViewManagerAdapterClassForViewManager:viewManager];
    [extraModules addObject:[[viewManagerAdapterClass alloc] init]];
  }

  // Silence ABI48_0_0React Native warning `Base module "%s" does not exist`
  // occurring when view manager class is subclassing another class
  // that is not ABI48_0_0RCTViewManager (in our case all the view manager adapters
  // subclass ABI48_0_0EXViewManagerAdapter, so RN expects to find ABI48_0_0EXViewManagerAdapter
  // exported.
  [extraModules addObject:[[ABI48_0_0EXViewManagerAdapter alloc] init]];

  // It is possible that among internal modules there are some ABI48_0_0RCTBridgeModules --
  // let's add them to extraModules here.
  for (id<ABI48_0_0EXInternalModule> module in [moduleRegistry getAllInternalModules]) {
    if ([module conformsToProtocol:@protocol(ABI48_0_0RCTBridgeModule)]) {
      id<ABI48_0_0RCTBridgeModule> reactBridgeModule = (id<ABI48_0_0RCTBridgeModule>)module;
      [extraModules addObject:reactBridgeModule];
    }
  }
  
  // Adding the way to access the module registry from ABI48_0_0RCTBridgeModules.
  [extraModules addObject:[[ABI48_0_0EXModuleRegistryHolderReactModule alloc] initWithModuleRegistry:moduleRegistry]];

  // One could add some modules to the Module Registry after creating it.
  // Here is our last call for finalizing initialization.
  [moduleRegistry initialize];
  return extraModules;
}

@end
