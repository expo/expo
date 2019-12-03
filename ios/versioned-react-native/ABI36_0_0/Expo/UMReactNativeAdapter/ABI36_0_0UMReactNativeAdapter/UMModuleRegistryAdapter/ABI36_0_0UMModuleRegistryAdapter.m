// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMReactNativeAdapter/ABI36_0_0UMViewManagerAdapter.h>
#import <ABI36_0_0UMReactNativeAdapter/ABI36_0_0UMModuleRegistryAdapter.h>
#import <ABI36_0_0UMReactNativeAdapter/ABI36_0_0UMViewManagerAdapterClassesRegistry.h>

@interface ABI36_0_0UMModuleRegistryAdapter ()

@property (nonatomic, strong) ABI36_0_0UMModuleRegistryProvider *moduleRegistryProvider;
@property (nonatomic, strong) ABI36_0_0UMViewManagerAdapterClassesRegistry *viewManagersClassesRegistry;

@end

@implementation ABI36_0_0UMModuleRegistryAdapter

- (instancetype)initWithModuleRegistryProvider:(ABI36_0_0UMModuleRegistryProvider *)moduleRegistryProvider
{
  if (self = [super init]) {
    _moduleRegistryProvider = moduleRegistryProvider;
    _viewManagersClassesRegistry = [[ABI36_0_0UMViewManagerAdapterClassesRegistry alloc] init];
  }
  return self;
}

- (NSArray<id<ABI36_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI36_0_0RCTBridge *)bridge
{
  return [self extraModulesForModuleRegistry:[_moduleRegistryProvider moduleRegistry]];
}

- (NSArray<id<ABI36_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI36_0_0UMModuleRegistry *)moduleRegistry
{
  NSMutableArray<id<ABI36_0_0RCTBridgeModule>> *extraModules = [NSMutableArray array];
  
  ABI36_0_0UMNativeModulesProxy *nativeModulesProxy = [[ABI36_0_0UMNativeModulesProxy alloc] initWithModuleRegistry:moduleRegistry];
  
  [extraModules addObject:nativeModulesProxy];
  
  for (ABI36_0_0UMViewManager *viewManager in [moduleRegistry getAllViewManagers]) {
    Class viewManagerAdapterClass = [_viewManagersClassesRegistry viewManagerAdapterClassForViewManager:viewManager];
    [extraModules addObject:[[viewManagerAdapterClass alloc] initWithViewManager:viewManager]];
  }

  // Silence ABI36_0_0React Native warning `Base module "%s" does not exist`
  // occurring when view manager class is subclassing another class
  // that is not ABI36_0_0RCTViewManager (in our case all the view manager adapters
  // subclass ABI36_0_0UMViewManagerAdapter, so ABI36_0_0RN expects to find ABI36_0_0UMViewManagerAdapter
  // exported.
  [extraModules addObject:[[ABI36_0_0UMViewManagerAdapter alloc] init]];

  // It is possible that among internal modules there are some ABI36_0_0RCTBridgeModules --
  // let's add them to extraModules here.
  for (id<ABI36_0_0UMInternalModule> module in [moduleRegistry getAllInternalModules]) {
    if ([module conformsToProtocol:@protocol(ABI36_0_0RCTBridgeModule)]) {
      id<ABI36_0_0RCTBridgeModule> ABI36_0_0ReactBridgeModule = (id<ABI36_0_0RCTBridgeModule>)module;
      [extraModules addObject:ABI36_0_0ReactBridgeModule];
    }
  }

  // One could add some modules to the Module Registry after creating it.
  // Here is our last call for finalizing initialization.
  [moduleRegistry initialize];
  return extraModules;
}

@end
