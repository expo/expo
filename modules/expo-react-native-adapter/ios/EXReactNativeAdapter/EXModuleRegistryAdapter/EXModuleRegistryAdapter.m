// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXReactNativeAdapter/EXViewManagerAdapter.h>
#import <EXReactNativeAdapter/EXReactNativeAdapter.h>
#import <EXReactNativeAdapter/EXModuleRegistryAdapter.h>
#import <EXReactNativeAdapter/EXViewManagerAdapterClassesRegistry.h>

@interface EXModuleRegistryAdapter ()

@property (nonatomic, strong) EXModuleRegistryProvider *moduleRegistryProvider;
@property (nonatomic, strong) EXViewManagerAdapterClassesRegistry *viewManagersClassesRegistry;

@end

@implementation EXModuleRegistryAdapter

- (instancetype)initWithModuleRegistryProvider:(EXModuleRegistryProvider *)moduleRegistryProvider
{
  if (self = [super init]) {
    _moduleRegistryProvider = moduleRegistryProvider;
    _viewManagersClassesRegistry = [[EXViewManagerAdapterClassesRegistry alloc] init];
  }
  return self;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge andExperience:(NSString *)experienceId
{
  return [self extraModulesForModuleRegistry:[_moduleRegistryProvider moduleRegistryForExperienceId:experienceId]];
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  NSMutableArray<id<RCTBridgeModule>> *extraModules = [NSMutableArray array];
  
  EXNativeModulesProxy *nativeModulesProxy = [[EXNativeModulesProxy alloc] initWithModuleRegistry:moduleRegistry];
  
  [extraModules addObject:nativeModulesProxy];
  
  for (EXViewManager *viewManager in [moduleRegistry getAllViewManagers]) {
    Class viewManagerAdapterClass = [_viewManagersClassesRegistry viewManagerAdapterClassForViewManager:viewManager];
    [extraModules addObject:[[viewManagerAdapterClass alloc] initWithViewManager:viewManager]];
  }

  // Silence React Native warning `Base module "%s" does not exist`
  // occurring when view manager class is subclassing another class
  // that is not RCTViewManager (in our case all the view manager adapters
  // subclass EXViewManagerAdapter, so RN expects to find EXViewManagerAdapter
  // exported.
  [extraModules addObject:[[EXViewManagerAdapter alloc] init]];

  // It is possible that among internal modules there are some RCTBridgeModules --
  // let's add them to extraModules here.
  for (id<EXInternalModule> module in [moduleRegistry getAllInternalModules]) {
    if ([module conformsToProtocol:@protocol(RCTBridgeModule)]) {
      id<RCTBridgeModule> reactBridgeModule = (id<RCTBridgeModule>)module;
      [extraModules addObject:reactBridgeModule];
    }
  }

  // One could add some modules to the Module Registry after creating it.
  // Here is our last call for finalizing initialization.
  [moduleRegistry initialize];
  return extraModules;
}

@end
