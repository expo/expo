// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMReactNativeAdapter/ABI40_0_0UMNativeModulesProxy.h>
#import <ABI40_0_0UMReactNativeAdapter/ABI40_0_0UMViewManagerAdapter.h>
#import <ABI40_0_0UMReactNativeAdapter/ABI40_0_0UMModuleRegistryAdapter.h>
#import <ABI40_0_0UMReactNativeAdapter/ABI40_0_0UMViewManagerAdapterClassesRegistry.h>
#import <ABI40_0_0UMReactNativeAdapter/ABI40_0_0UMModuleRegistryHolderReactModule.h>

@interface ABI40_0_0UMModuleRegistryAdapter ()

@property (nonatomic, strong) ABI40_0_0UMModuleRegistryProvider *moduleRegistryProvider;
@property (nonatomic, strong) ABI40_0_0UMViewManagerAdapterClassesRegistry *viewManagersClassesRegistry;

@end

@implementation ABI40_0_0UMModuleRegistryAdapter

- (instancetype)initWithModuleRegistryProvider:(ABI40_0_0UMModuleRegistryProvider *)moduleRegistryProvider
{
  if (self = [super init]) {
    _moduleRegistryProvider = moduleRegistryProvider;
    _viewManagersClassesRegistry = [[ABI40_0_0UMViewManagerAdapterClassesRegistry alloc] init];
  }
  return self;
}

- (NSArray<id<ABI40_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI40_0_0RCTBridge *)bridge
{
  return [self extraModulesForModuleRegistry:[_moduleRegistryProvider moduleRegistry]];
}

- (NSArray<id<ABI40_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI40_0_0UMModuleRegistry *)moduleRegistry
{
  NSMutableArray<id<ABI40_0_0RCTBridgeModule>> *extraModules = [NSMutableArray array];
  
  ABI40_0_0UMNativeModulesProxy *nativeModulesProxy = [[ABI40_0_0UMNativeModulesProxy alloc] initWithModuleRegistry:moduleRegistry];
  
  [extraModules addObject:nativeModulesProxy];
  
  for (ABI40_0_0UMViewManager *viewManager in [moduleRegistry getAllViewManagers]) {
    Class viewManagerAdapterClass = [_viewManagersClassesRegistry viewManagerAdapterClassForViewManager:viewManager];
    [extraModules addObject:[[viewManagerAdapterClass alloc] initWithViewManager:viewManager]];
  }

  // Silence ABI40_0_0React Native warning `Base module "%s" does not exist`
  // occurring when view manager class is subclassing another class
  // that is not ABI40_0_0RCTViewManager (in our case all the view manager adapters
  // subclass ABI40_0_0UMViewManagerAdapter, so ABI40_0_0RN expects to find ABI40_0_0UMViewManagerAdapter
  // exported.
  [extraModules addObject:[[ABI40_0_0UMViewManagerAdapter alloc] init]];

  // It is possible that among internal modules there are some ABI40_0_0RCTBridgeModules --
  // let's add them to extraModules here.
  for (id<ABI40_0_0UMInternalModule> module in [moduleRegistry getAllInternalModules]) {
    if ([module conformsToProtocol:@protocol(ABI40_0_0RCTBridgeModule)]) {
      id<ABI40_0_0RCTBridgeModule> ABI40_0_0ReactBridgeModule = (id<ABI40_0_0RCTBridgeModule>)module;
      [extraModules addObject:ABI40_0_0ReactBridgeModule];
    }
  }
  
  // Adding the way to access the module registry from ABI40_0_0RCTBridgeModules.
  [extraModules addObject:[[ABI40_0_0UMModuleRegistryHolderReactModule alloc] initWithModuleRegistry:moduleRegistry]];

  // One could add some modules to the Module Registry after creating it.
  // Here is our last call for finalizing initialization.
  [moduleRegistry initialize];
  return extraModules;
}

@end
