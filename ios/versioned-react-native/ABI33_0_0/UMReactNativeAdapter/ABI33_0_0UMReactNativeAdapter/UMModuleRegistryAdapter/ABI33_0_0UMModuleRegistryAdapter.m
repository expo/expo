// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMReactNativeAdapter/ABI33_0_0UMViewManagerAdapter.h>
#import <ABI33_0_0UMReactNativeAdapter/ABI33_0_0UMModuleRegistryAdapter.h>
#import <ABI33_0_0UMReactNativeAdapter/ABI33_0_0UMViewManagerAdapterClassesRegistry.h>

@interface ABI33_0_0UMModuleRegistryAdapter ()

@property (nonatomic, strong) ABI33_0_0UMModuleRegistryProvider *moduleRegistryProvider;
@property (nonatomic, strong) ABI33_0_0UMViewManagerAdapterClassesRegistry *viewManagersClassesRegistry;

@end

@implementation ABI33_0_0UMModuleRegistryAdapter

- (instancetype)initWithModuleRegistryProvider:(ABI33_0_0UMModuleRegistryProvider *)moduleRegistryProvider
{
  if (self = [super init]) {
    _moduleRegistryProvider = moduleRegistryProvider;
    _viewManagersClassesRegistry = [[ABI33_0_0UMViewManagerAdapterClassesRegistry alloc] init];
  }
  return self;
}

- (NSArray<id<ABI33_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI33_0_0RCTBridge *)bridge
{
  return [self extraModulesForModuleRegistry:[_moduleRegistryProvider moduleRegistry]];
}

- (NSArray<id<ABI33_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI33_0_0UMModuleRegistry *)moduleRegistry
{
  NSMutableArray<id<ABI33_0_0RCTBridgeModule>> *extraModules = [NSMutableArray array];
  
  ABI33_0_0UMNativeModulesProxy *nativeModulesProxy = [[ABI33_0_0UMNativeModulesProxy alloc] initWithModuleRegistry:moduleRegistry];
  
  [extraModules addObject:nativeModulesProxy];
  
  for (ABI33_0_0UMViewManager *viewManager in [moduleRegistry getAllViewManagers]) {
    Class viewManagerAdapterClass = [_viewManagersClassesRegistry viewManagerAdapterClassForViewManager:viewManager];
    [extraModules addObject:[[viewManagerAdapterClass alloc] initWithViewManager:viewManager]];
  }

  // Silence ReactABI33_0_0 Native warning `Base module "%s" does not exist`
  // occurring when view manager class is subclassing another class
  // that is not ABI33_0_0RCTViewManager (in our case all the view manager adapters
  // subclass ABI33_0_0UMViewManagerAdapter, so RN expects to find ABI33_0_0UMViewManagerAdapter
  // exported.
  [extraModules addObject:[[ABI33_0_0UMViewManagerAdapter alloc] init]];

  // It is possible that among internal modules there are some ABI33_0_0RCTBridgeModules --
  // let's add them to extraModules here.
  for (id<ABI33_0_0UMInternalModule> module in [moduleRegistry getAllInternalModules]) {
    if ([module conformsToProtocol:@protocol(ABI33_0_0RCTBridgeModule)]) {
      id<ABI33_0_0RCTBridgeModule> ReactABI33_0_0BridgeModule = (id<ABI33_0_0RCTBridgeModule>)module;
      [extraModules addObject:ReactABI33_0_0BridgeModule];
    }
  }

  // One could add some modules to the Module Registry after creating it.
  // Here is our last call for finalizing initialization.
  [moduleRegistry initialize];
  return extraModules;
}

@end
