// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMReactNativeAdapter/ABI41_0_0UMNativeModulesProxy.h>
#import <ABI41_0_0UMReactNativeAdapter/ABI41_0_0UMViewManagerAdapter.h>
#import <ABI41_0_0UMReactNativeAdapter/ABI41_0_0UMModuleRegistryAdapter.h>
#import <ABI41_0_0UMReactNativeAdapter/ABI41_0_0UMViewManagerAdapterClassesRegistry.h>
#import <ABI41_0_0UMReactNativeAdapter/ABI41_0_0UMModuleRegistryHolderReactModule.h>

@interface ABI41_0_0UMModuleRegistryAdapter ()

@property (nonatomic, strong) ABI41_0_0UMModuleRegistryProvider *moduleRegistryProvider;
@property (nonatomic, strong) ABI41_0_0UMViewManagerAdapterClassesRegistry *viewManagersClassesRegistry;

@end

@implementation ABI41_0_0UMModuleRegistryAdapter

- (instancetype)initWithModuleRegistryProvider:(ABI41_0_0UMModuleRegistryProvider *)moduleRegistryProvider
{
  if (self = [super init]) {
    _moduleRegistryProvider = moduleRegistryProvider;
    _viewManagersClassesRegistry = [[ABI41_0_0UMViewManagerAdapterClassesRegistry alloc] init];
  }
  return self;
}

- (NSArray<id<ABI41_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI41_0_0RCTBridge *)bridge
{
  return [self extraModulesForModuleRegistry:[_moduleRegistryProvider moduleRegistry]];
}

- (NSArray<id<ABI41_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  NSMutableArray<id<ABI41_0_0RCTBridgeModule>> *extraModules = [NSMutableArray array];
  
  ABI41_0_0UMNativeModulesProxy *nativeModulesProxy = [[ABI41_0_0UMNativeModulesProxy alloc] initWithModuleRegistry:moduleRegistry];
  
  [extraModules addObject:nativeModulesProxy];
  
  for (ABI41_0_0UMViewManager *viewManager in [moduleRegistry getAllViewManagers]) {
    Class viewManagerAdapterClass = [_viewManagersClassesRegistry viewManagerAdapterClassForViewManager:viewManager];
    [extraModules addObject:[[viewManagerAdapterClass alloc] initWithViewManager:viewManager]];
  }

  // Silence ABI41_0_0React Native warning `Base module "%s" does not exist`
  // occurring when view manager class is subclassing another class
  // that is not ABI41_0_0RCTViewManager (in our case all the view manager adapters
  // subclass ABI41_0_0UMViewManagerAdapter, so ABI41_0_0RN expects to find ABI41_0_0UMViewManagerAdapter
  // exported.
  [extraModules addObject:[[ABI41_0_0UMViewManagerAdapter alloc] init]];

  // It is possible that among internal modules there are some ABI41_0_0RCTBridgeModules --
  // let's add them to extraModules here.
  for (id<ABI41_0_0UMInternalModule> module in [moduleRegistry getAllInternalModules]) {
    if ([module conformsToProtocol:@protocol(ABI41_0_0RCTBridgeModule)]) {
      id<ABI41_0_0RCTBridgeModule> ABI41_0_0ReactBridgeModule = (id<ABI41_0_0RCTBridgeModule>)module;
      [extraModules addObject:ABI41_0_0ReactBridgeModule];
    }
  }
  
  // Adding the way to access the module registry from ABI41_0_0RCTBridgeModules.
  [extraModules addObject:[[ABI41_0_0UMModuleRegistryHolderReactModule alloc] initWithModuleRegistry:moduleRegistry]];

  // One could add some modules to the Module Registry after creating it.
  // Here is our last call for finalizing initialization.
  [moduleRegistry initialize];
  return extraModules;
}

@end
