// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXNativeModulesProxy.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryAdapter.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryProvider.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistryHolderReactModule.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXReactNativeEventEmitter.h>

@interface ABI49_0_0EXModuleRegistryAdapter ()

@property (nonatomic, strong) ABI49_0_0EXModuleRegistryProvider *moduleRegistryProvider;

@end

@implementation ABI49_0_0EXModuleRegistryAdapter

- (instancetype)initWithModuleRegistryProvider:(ABI49_0_0EXModuleRegistryProvider *)moduleRegistryProvider
{
  if (self = [super init]) {
    _moduleRegistryProvider = moduleRegistryProvider;
  }
  return self;
}

- (NSArray<id<ABI49_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI49_0_0RCTBridge *)bridge
{
  return [self extraModulesForModuleRegistry:[_moduleRegistryProvider moduleRegistry]];
}

- (NSArray<id<ABI49_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI49_0_0EXModuleRegistry *)moduleRegistry
{
  NSMutableArray<id<ABI49_0_0RCTBridgeModule>> *extraModules = [NSMutableArray array];

  ABI49_0_0EXNativeModulesProxy *nativeModulesProxy = [[ABI49_0_0EXNativeModulesProxy alloc] initWithModuleRegistry:moduleRegistry];
  [extraModules addObject:nativeModulesProxy];

  // Event emitter is not automatically registered — we add it to the module registry here.
  // It will be added to the bridge later in this method, as it conforms to `ABI49_0_0RCTBridgeModule`.
  ABI49_0_0EXReactNativeEventEmitter *eventEmitter = [ABI49_0_0EXReactNativeEventEmitter new];
  [moduleRegistry registerInternalModule:eventEmitter];

  // It is possible that among internal modules there are some ABI49_0_0RCTBridgeModules --
  // let's add them to extraModules here.
  for (id<ABI49_0_0EXInternalModule> module in [moduleRegistry getAllInternalModules]) {
    if ([module conformsToProtocol:@protocol(ABI49_0_0RCTBridgeModule)]) {
      id<ABI49_0_0RCTBridgeModule> reactBridgeModule = (id<ABI49_0_0RCTBridgeModule>)module;
      [extraModules addObject:reactBridgeModule];
    }
  }
  
  // Adding the way to access the module registry from ABI49_0_0RCTBridgeModules.
  [extraModules addObject:[[ABI49_0_0EXModuleRegistryHolderReactModule alloc] initWithModuleRegistry:moduleRegistry]];

  // One could add some modules to the Module Registry after creating it.
  // Here is our last call for finalizing initialization.
  [moduleRegistry initialize];
  return extraModules;
}

@end
