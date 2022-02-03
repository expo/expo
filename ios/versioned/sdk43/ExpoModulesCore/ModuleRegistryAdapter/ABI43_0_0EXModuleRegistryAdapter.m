// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXNativeModulesProxy.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXViewManagerAdapter.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryAdapter.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryProvider.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXViewManagerAdapterClassesRegistry.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryHolderReactModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXReactNativeEventEmitter.h>
#if __has_include(<ExpoModulesCore/ExpoModulesCore-Swift.h>)
// For cocoapods framework, the generated swift header will be inside ExpoModulesCore module
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0ExpoModulesCore-Swift.h>
#else
#import "ABI43_0_0ExpoModulesCore-Swift.h"
#endif

@interface ABI43_0_0EXModuleRegistryAdapter ()

@property (nonatomic, strong) ABI43_0_0EXModuleRegistryProvider *moduleRegistryProvider;
@property (nonatomic, strong) ABI43_0_0EXViewManagerAdapterClassesRegistry *viewManagersClassesRegistry;
@property (nonatomic, strong, nullable) id<ModulesProviderObjCProtocol> swiftModulesProvider;

@end

@implementation ABI43_0_0EXModuleRegistryAdapter

- (instancetype)initWithModuleRegistryProvider:(ABI43_0_0EXModuleRegistryProvider *)moduleRegistryProvider
{
  if (self = [super init]) {
    _moduleRegistryProvider = moduleRegistryProvider;
    _viewManagersClassesRegistry = [[ABI43_0_0EXViewManagerAdapterClassesRegistry alloc] init];
  }
  return self;
}

- (instancetype)initWithModuleRegistryProvider:(ABI43_0_0EXModuleRegistryProvider *)moduleRegistryProvider swiftModulesProviderClass:(nullable Class)swiftModulesProviderClass
{
  if (self = [self initWithModuleRegistryProvider:moduleRegistryProvider]) {
    if ([swiftModulesProviderClass conformsToProtocol:@protocol(ModulesProviderObjCProtocol)]) {
      _swiftModulesProvider = [swiftModulesProviderClass new];
    }
  }
  return self;
}

- (NSArray<id<ABI43_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI43_0_0RCTBridge *)bridge
{
  return [self extraModulesForModuleRegistry:[_moduleRegistryProvider moduleRegistry]];
}

- (NSArray<id<ABI43_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  NSMutableArray<id<ABI43_0_0RCTBridgeModule>> *extraModules = [NSMutableArray array];

  ABI43_0_0EXNativeModulesProxy *nativeModulesProxy = [[ABI43_0_0EXNativeModulesProxy alloc] initWithModuleRegistry:moduleRegistry];
  [extraModules addObject:nativeModulesProxy];

  // Event emitter is not automatically registered — we add it to the module registry here.
  // It will be added to the bridge later in this method, as it conforms to `ABI43_0_0RCTBridgeModule`.
  ABI43_0_0EXReactNativeEventEmitter *eventEmitter = [ABI43_0_0EXReactNativeEventEmitter new];
  [moduleRegistry registerInternalModule:eventEmitter];

  NSMutableSet *exportedSwiftViewModuleNames = [NSMutableSet new];

  for (ViewModuleWrapper *swiftViewModule in [nativeModulesProxy.swiftInteropBridge getViewManagers]) {
    Class wrappedViewModuleClass = [ViewModuleWrapper createViewModuleWrapperClassWithModule:swiftViewModule];
    [extraModules addObject:[[wrappedViewModuleClass alloc] init]];
    [exportedSwiftViewModuleNames addObject:swiftViewModule.name];
  }
  for (ABI43_0_0EXViewManager *viewManager in [moduleRegistry getAllViewManagers]) {
    if (![exportedSwiftViewModuleNames containsObject:viewManager.viewName]) {
      Class viewManagerAdapterClass = [ABI43_0_0EXViewManagerAdapterClassesRegistry createViewManagerAdapterClassForViewManager:viewManager];
      [extraModules addObject:[[viewManagerAdapterClass alloc] init]];
    }
  }

  // Silence ABI43_0_0React Native warning `Base module "%s" does not exist`
  // occurring when view manager class is subclassing another class
  // that is not ABI43_0_0RCTViewManager (in our case all the view manager adapters
  // subclass ABI43_0_0EXViewManagerAdapter, so RN expects to find ABI43_0_0EXViewManagerAdapter
  // exported.
  [extraModules addObject:[[ABI43_0_0EXViewManagerAdapter alloc] init]];
  [extraModules addObject:[[ViewModuleWrapper alloc] initWithDummy:nil]];

  // It is possible that among internal modules there are some ABI43_0_0RCTBridgeModules --
  // let's add them to extraModules here.
  for (id<ABI43_0_0EXInternalModule> module in [moduleRegistry getAllInternalModules]) {
    if ([module conformsToProtocol:@protocol(ABI43_0_0RCTBridgeModule)]) {
      id<ABI43_0_0RCTBridgeModule> reactBridgeModule = (id<ABI43_0_0RCTBridgeModule>)module;
      [extraModules addObject:reactBridgeModule];
    }
  }
  
  // Adding the way to access the module registry from ABI43_0_0RCTBridgeModules.
  [extraModules addObject:[[ABI43_0_0EXModuleRegistryHolderReactModule alloc] initWithModuleRegistry:moduleRegistry]];

  // One could add some modules to the Module Registry after creating it.
  // Here is our last call for finalizing initialization.
  [moduleRegistry initialize];
  return extraModules;
}

- (nullable SwiftInteropBridge *)swiftInteropBridgeModulesRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  if (_swiftModulesProvider) {
    return [[SwiftInteropBridge alloc] initWithModulesProvider:_swiftModulesProvider legacyModuleRegistry:moduleRegistry];
  } else {
    return nil;
  }
}

@end
