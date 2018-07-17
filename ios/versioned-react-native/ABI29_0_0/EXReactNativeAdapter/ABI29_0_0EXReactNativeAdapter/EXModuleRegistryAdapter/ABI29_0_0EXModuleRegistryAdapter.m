// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI29_0_0EXReactNativeAdapter/ABI29_0_0EXViewManagerAdapter.h>
#import <ABI29_0_0EXReactNativeAdapter/ABI29_0_0EXModuleRegistryAdapter.h>
#import <ABI29_0_0EXReactNativeAdapter/ABI29_0_0EXViewManagerAdapterClassesRegistry.h>

@interface ABI29_0_0EXModuleRegistryAdapter ()

@property (nonatomic, strong) ABI29_0_0EXModuleRegistryProvider *moduleRegistryProvider;
@property (nonatomic, strong) ABI29_0_0EXViewManagerAdapterClassesRegistry *viewManagersClassesRegistry;

@end

@implementation ABI29_0_0EXModuleRegistryAdapter

- (instancetype)initWithModuleRegistryProvider:(ABI29_0_0EXModuleRegistryProvider *)moduleRegistryProvider
{
  if (self = [super init]) {
    _moduleRegistryProvider = moduleRegistryProvider;
    _viewManagersClassesRegistry = [[ABI29_0_0EXViewManagerAdapterClassesRegistry alloc] init];
  }
  return self;
}

- (NSArray<id<ABI29_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI29_0_0RCTBridge *)bridge andExperience:(NSString *)experienceId
{
  return [self extraModulesForModuleRegistry:[_moduleRegistryProvider moduleRegistryForExperienceId:experienceId]];
}

- (NSArray<id<ABI29_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI29_0_0EXModuleRegistry *)moduleRegistry
{
  NSMutableArray<id<ABI29_0_0RCTBridgeModule>> *extraModules = [NSMutableArray array];
  
  ABI29_0_0EXNativeModulesProxy *nativeModulesProxy = [[ABI29_0_0EXNativeModulesProxy alloc] initWithModuleRegistry:moduleRegistry];
  
  [extraModules addObject:nativeModulesProxy];
  
  for (ABI29_0_0EXViewManager *viewManager in [moduleRegistry getAllViewManagers]) {
    Class viewManagerAdapterClass = [_viewManagersClassesRegistry viewManagerAdapterClassForViewManager:viewManager];
    [extraModules addObject:[[viewManagerAdapterClass alloc] initWithViewManager:viewManager]];
  }

  // Silence ReactABI29_0_0 Native warning `Base module "%s" does not exist`
  // occurring when view manager class is subclassing another class
  // that is not ABI29_0_0RCTViewManager (in our case all the view manager adapters
  // subclass ABI29_0_0EXViewManagerAdapter, so RN expects to find ABI29_0_0EXViewManagerAdapter
  // exported.
  [extraModules addObject:[[ABI29_0_0EXViewManagerAdapter alloc] init]];

  // It is possible that among internal modules there are some ABI29_0_0RCTBridgeModules --
  // let's add them to extraModules here.
  for (id<ABI29_0_0EXInternalModule> module in [moduleRegistry getAllInternalModules]) {
    if ([module conformsToProtocol:@protocol(ABI29_0_0RCTBridgeModule)]) {
      id<ABI29_0_0RCTBridgeModule> ReactABI29_0_0BridgeModule = (id<ABI29_0_0RCTBridgeModule>)module;
      [extraModules addObject:ReactABI29_0_0BridgeModule];
    }
  }

  // One could add some modules to the Module Registry after creating it.
  // Here is our last call for finalizing initialization.
  [moduleRegistry initialize];
  return extraModules;
}

@end
