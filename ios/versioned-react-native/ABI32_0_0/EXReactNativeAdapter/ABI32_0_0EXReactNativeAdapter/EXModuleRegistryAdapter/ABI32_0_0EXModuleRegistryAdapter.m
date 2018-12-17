// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXReactNativeAdapter/ABI32_0_0EXViewManagerAdapter.h>
#import <ABI32_0_0EXReactNativeAdapter/ABI32_0_0EXModuleRegistryAdapter.h>
#import <ABI32_0_0EXReactNativeAdapter/ABI32_0_0EXViewManagerAdapterClassesRegistry.h>

@interface ABI32_0_0EXModuleRegistryAdapter ()

@property (nonatomic, strong) ABI32_0_0EXModuleRegistryProvider *moduleRegistryProvider;
@property (nonatomic, strong) ABI32_0_0EXViewManagerAdapterClassesRegistry *viewManagersClassesRegistry;

@end

@implementation ABI32_0_0EXModuleRegistryAdapter

- (instancetype)initWithModuleRegistryProvider:(ABI32_0_0EXModuleRegistryProvider *)moduleRegistryProvider
{
  if (self = [super init]) {
    _moduleRegistryProvider = moduleRegistryProvider;
    _viewManagersClassesRegistry = [[ABI32_0_0EXViewManagerAdapterClassesRegistry alloc] init];
  }
  return self;
}

- (NSArray<id<ABI32_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI32_0_0RCTBridge *)bridge andExperience:(NSString *)experienceId
{
  return [self extraModulesForModuleRegistry:[_moduleRegistryProvider moduleRegistryForExperienceId:experienceId]];
}

- (NSArray<id<ABI32_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI32_0_0EXModuleRegistry *)moduleRegistry
{
  NSMutableArray<id<ABI32_0_0RCTBridgeModule>> *extraModules = [NSMutableArray array];
  
  ABI32_0_0EXNativeModulesProxy *nativeModulesProxy = [[ABI32_0_0EXNativeModulesProxy alloc] initWithModuleRegistry:moduleRegistry];
  
  [extraModules addObject:nativeModulesProxy];
  
  for (ABI32_0_0EXViewManager *viewManager in [moduleRegistry getAllViewManagers]) {
    Class viewManagerAdapterClass = [_viewManagersClassesRegistry viewManagerAdapterClassForViewManager:viewManager];
    [extraModules addObject:[[viewManagerAdapterClass alloc] initWithViewManager:viewManager]];
  }

  // Silence ReactABI32_0_0 Native warning `Base module "%s" does not exist`
  // occurring when view manager class is subclassing another class
  // that is not ABI32_0_0RCTViewManager (in our case all the view manager adapters
  // subclass ABI32_0_0EXViewManagerAdapter, so RN expects to find ABI32_0_0EXViewManagerAdapter
  // exported.
  [extraModules addObject:[[ABI32_0_0EXViewManagerAdapter alloc] init]];

  // It is possible that among internal modules there are some ABI32_0_0RCTBridgeModules --
  // let's add them to extraModules here.
  for (id<ABI32_0_0EXInternalModule> module in [moduleRegistry getAllInternalModules]) {
    if ([module conformsToProtocol:@protocol(ABI32_0_0RCTBridgeModule)]) {
      id<ABI32_0_0RCTBridgeModule> ReactABI32_0_0BridgeModule = (id<ABI32_0_0RCTBridgeModule>)module;
      [extraModules addObject:ReactABI32_0_0BridgeModule];
    }
  }

  // One could add some modules to the Module Registry after creating it.
  // Here is our last call for finalizing initialization.
  [moduleRegistry initialize];
  return extraModules;
}

@end
