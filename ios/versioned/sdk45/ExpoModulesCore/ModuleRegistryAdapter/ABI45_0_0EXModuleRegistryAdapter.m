// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXNativeModulesProxy.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXViewManagerAdapter.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryAdapter.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryProvider.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXViewManagerAdapterClassesRegistry.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistryHolderReactModule.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXReactNativeEventEmitter.h>
#import <ABI45_0_0ExpoModulesCore/Swift.h>

@interface ABI45_0_0EXModuleRegistryAdapter ()

@property (nonatomic, strong) ABI45_0_0EXModuleRegistryProvider *moduleRegistryProvider;
@property (nonatomic, strong) ABI45_0_0EXViewManagerAdapterClassesRegistry *viewManagersClassesRegistry;
@property (nonatomic, strong, nullable) ModulesProvider *swiftModulesProvider;

@end

@implementation ABI45_0_0EXModuleRegistryAdapter

- (instancetype)initWithModuleRegistryProvider:(ABI45_0_0EXModuleRegistryProvider *)moduleRegistryProvider
{
  if (self = [super init]) {
    _moduleRegistryProvider = moduleRegistryProvider;
    _viewManagersClassesRegistry = [[ABI45_0_0EXViewManagerAdapterClassesRegistry alloc] init];
  }
  return self;
}

- (NSArray<id<ABI45_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI45_0_0RCTBridge *)bridge
{
  return [self extraModulesForModuleRegistry:[_moduleRegistryProvider moduleRegistry]];
}

- (NSArray<id<ABI45_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI45_0_0EXModuleRegistry *)moduleRegistry
{
  NSMutableArray<id<ABI45_0_0RCTBridgeModule>> *extraModules = [NSMutableArray array];

  ABI45_0_0EXNativeModulesProxy *nativeModulesProxy = [[ABI45_0_0EXNativeModulesProxy alloc] initWithModuleRegistry:moduleRegistry];
  [extraModules addObject:nativeModulesProxy];

  // Event emitter is not automatically registered — we add it to the module registry here.
  // It will be added to the bridge later in this method, as it conforms to `ABI45_0_0RCTBridgeModule`.
  ABI45_0_0EXReactNativeEventEmitter *eventEmitter = [ABI45_0_0EXReactNativeEventEmitter new];
  [moduleRegistry registerInternalModule:eventEmitter];

  for (ABI45_0_0EXViewManager *viewManager in [moduleRegistry getAllViewManagers]) {
    Class viewManagerAdapterClass = [ABI45_0_0EXViewManagerAdapterClassesRegistry createViewManagerAdapterClassForViewManager:viewManager];
    [extraModules addObject:[[viewManagerAdapterClass alloc] init]];
  }

  // Silence ABI45_0_0React Native warning `Base module "%s" does not exist`
  // occurring when view manager class is subclassing another class
  // that is not ABI45_0_0RCTViewManager (in our case all the view manager adapters
  // subclass ABI45_0_0EXViewManagerAdapter, so RN expects to find ABI45_0_0EXViewManagerAdapter
  // exported.
  [extraModules addObject:[[ABI45_0_0EXViewManagerAdapter alloc] init]];

  // It is possible that among internal modules there are some ABI45_0_0RCTBridgeModules --
  // let's add them to extraModules here.
  for (id<ABI45_0_0EXInternalModule> module in [moduleRegistry getAllInternalModules]) {
    if ([module conformsToProtocol:@protocol(ABI45_0_0RCTBridgeModule)]) {
      id<ABI45_0_0RCTBridgeModule> reactBridgeModule = (id<ABI45_0_0RCTBridgeModule>)module;
      [extraModules addObject:reactBridgeModule];
    }
  }
  
  // Adding the way to access the module registry from ABI45_0_0RCTBridgeModules.
  [extraModules addObject:[[ABI45_0_0EXModuleRegistryHolderReactModule alloc] initWithModuleRegistry:moduleRegistry]];

  // One could add some modules to the Module Registry after creating it.
  // Here is our last call for finalizing initialization.
  [moduleRegistry initialize];
  return extraModules;
}

- (nullable SwiftInteropBridge *)swiftInteropBridgeModulesRegistry:(ABI45_0_0EXModuleRegistry *)moduleRegistry
{
  if (_swiftModulesProvider) {
    return [[SwiftInteropBridge alloc] initWithModulesProvider:_swiftModulesProvider legacyModuleRegistry:moduleRegistry];
  } else {
    return nil;
  }
}

@end
