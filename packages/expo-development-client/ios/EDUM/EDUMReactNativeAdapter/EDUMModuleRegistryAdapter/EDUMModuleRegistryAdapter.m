// Copyright 2018-present 650 Industries. All rights reserved.

#import <EDUMViewManagerAdapter.h>
#import <EDUMModuleRegistryAdapter.h>
#import <EDUMViewManagerAdapterClassesRegistry.h>
#import <EDUMModuleRegistryHolderReactModule.h>

@interface EDUMModuleRegistryAdapter ()

@property (nonatomic, strong) EDUMModuleRegistryProvider *moduleRegistryProvider;
@property (nonatomic, strong) EDUMViewManagerAdapterClassesRegistry *viewManagersClassesRegistry;

@end

@implementation EDUMModuleRegistryAdapter

- (instancetype)initWithModuleRegistryProvider:(EDUMModuleRegistryProvider *)moduleRegistryProvider
{
  if (self = [super init]) {
    _moduleRegistryProvider = moduleRegistryProvider;
    _viewManagersClassesRegistry = [[EDUMViewManagerAdapterClassesRegistry alloc] init];
  }
  return self;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  return [self extraModulesForModuleRegistry:[_moduleRegistryProvider moduleRegistry]];
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForModuleRegistry:(EDUMModuleRegistry *)moduleRegistry
{
  NSMutableArray<id<RCTBridgeModule>> *extraModules = [NSMutableArray array];
  
  EDUMNativeModulesProxy *nativeModulesProxy = [[EDUMNativeModulesProxy alloc] initWithModuleRegistry:moduleRegistry];
  
  [extraModules addObject:nativeModulesProxy];
  
  for (EDUMViewManager *viewManager in [moduleRegistry getAllViewManagers]) {
    Class viewManagerAdapterClass = [_viewManagersClassesRegistry viewManagerAdapterClassForViewManager:viewManager];
    [extraModules addObject:[[viewManagerAdapterClass alloc] initWithViewManager:viewManager]];
  }

  // Silence React Native warning `Base module "%s" does not exist`
  // occurring when view manager class is subclassing another class
  // that is not RCTViewManager (in our case all the view manager adapters
  // subclass EDUMViewManagerAdapter, so RN expects to find EDUMViewManagerAdapter
  // exported.
  [extraModules addObject:[[EDUMViewManagerAdapter alloc] init]];

  // It is possible that among internal modules there are some RCTBridgeModules --
  // let's add them to extraModules here.
  for (id<EDUMInternalModule> module in [moduleRegistry getAllInternalModules]) {
    if ([module conformsToProtocol:@protocol(RCTBridgeModule)]) {
      id<RCTBridgeModule> reactBridgeModule = (id<RCTBridgeModule>)module;
      [extraModules addObject:reactBridgeModule];
    }
  }
  
  // Adding the way to access the module registry from RCTBridgeModules.
  [extraModules addObject:[[EDUMModuleRegistryHolderReactModule alloc] initWithModuleRegistry:moduleRegistry]];

  // One could add some modules to the Module Registry after creating it.
  // Here is our last call for finalizing initialization.
  [moduleRegistry initialize];
  return extraModules;
}

@end
