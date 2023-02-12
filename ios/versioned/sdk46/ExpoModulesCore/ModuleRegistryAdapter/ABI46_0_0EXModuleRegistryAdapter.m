// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXNativeModulesProxy.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXViewManagerAdapter.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryAdapter.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryProvider.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXViewManagerAdapterClassesRegistry.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistryHolderReactModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXReactNativeEventEmitter.h>

@interface ABI46_0_0EXModuleRegistryAdapter ()

@property (nonatomic, strong) ABI46_0_0EXModuleRegistryProvider *moduleRegistryProvider;
@property (nonatomic, strong) ABI46_0_0EXViewManagerAdapterClassesRegistry *viewManagersClassesRegistry;

@end

@implementation ABI46_0_0EXModuleRegistryAdapter

- (instancetype)initWithModuleRegistryProvider:(ABI46_0_0EXModuleRegistryProvider *)moduleRegistryProvider
{
  if (self = [super init]) {
    _moduleRegistryProvider = moduleRegistryProvider;
    _viewManagersClassesRegistry = [[ABI46_0_0EXViewManagerAdapterClassesRegistry alloc] init];
  }
  return self;
}

- (NSArray<id<ABI46_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI46_0_0RCTBridge *)bridge
{
  return [self extraModulesForModuleRegistry:[_moduleRegistryProvider moduleRegistry]];
}

- (NSArray<id<ABI46_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI46_0_0EXModuleRegistry *)moduleRegistry
{
  NSMutableArray<id<ABI46_0_0RCTBridgeModule>> *extraModules = [NSMutableArray array];

  ABI46_0_0EXNativeModulesProxy *nativeModulesProxy = [[ABI46_0_0EXNativeModulesProxy alloc] initWithModuleRegistry:moduleRegistry];
  [extraModules addObject:nativeModulesProxy];

  // Event emitter is not automatically registered — we add it to the module registry here.
  // It will be added to the bridge later in this method, as it conforms to `ABI46_0_0RCTBridgeModule`.
  ABI46_0_0EXReactNativeEventEmitter *eventEmitter = [ABI46_0_0EXReactNativeEventEmitter new];
  [moduleRegistry registerInternalModule:eventEmitter];

  for (ABI46_0_0EXViewManager *viewManager in [moduleRegistry getAllViewManagers]) {
    Class viewManagerAdapterClass = [ABI46_0_0EXViewManagerAdapterClassesRegistry createViewManagerAdapterClassForViewManager:viewManager];
    [extraModules addObject:[[viewManagerAdapterClass alloc] init]];
  }

  // Silence ABI46_0_0React Native warning `Base module "%s" does not exist`
  // occurring when view manager class is subclassing another class
  // that is not ABI46_0_0RCTViewManager (in our case all the view manager adapters
  // subclass ABI46_0_0EXViewManagerAdapter, so RN expects to find ABI46_0_0EXViewManagerAdapter
  // exported.
  [extraModules addObject:[[ABI46_0_0EXViewManagerAdapter alloc] init]];

  // It is possible that among internal modules there are some ABI46_0_0RCTBridgeModules --
  // let's add them to extraModules here.
  for (id<ABI46_0_0EXInternalModule> module in [moduleRegistry getAllInternalModules]) {
    if ([module conformsToProtocol:@protocol(ABI46_0_0RCTBridgeModule)]) {
      id<ABI46_0_0RCTBridgeModule> reactBridgeModule = (id<ABI46_0_0RCTBridgeModule>)module;
      [extraModules addObject:reactBridgeModule];
    }
  }
  
  // Adding the way to access the module registry from ABI46_0_0RCTBridgeModules.
  [extraModules addObject:[[ABI46_0_0EXModuleRegistryHolderReactModule alloc] initWithModuleRegistry:moduleRegistry]];

  // One could add some modules to the Module Registry after creating it.
  // Here is our last call for finalizing initialization.
  [moduleRegistry initialize];
  return extraModules;
}

@end
