// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>
#import <ExpoModulesCore/EXModuleRegistryProvider.h>

// An "adapter" over module registry, for given RCTBridge and NSString
// is able to provide an array of exported RCTBridgeModules. Override
// it and use in your AppDelegate to export different bridge modules
// for different experiences.

NS_SWIFT_NAME(ModuleRegistryAdapter)
@interface EXModuleRegistryAdapter : NSObject

@property (nonnull, nonatomic, readonly) EXModuleRegistryProvider *moduleRegistryProvider;

- (instancetype)initWithModuleRegistryProvider:(nonnull EXModuleRegistryProvider *)moduleRegistryProvider
__deprecated_msg("Expo modules are now being automatically registered. You can delete it altogether.");

- (nonnull NSArray<id<RCTBridgeModule>> *)extraModulesForModuleRegistry:(nonnull EXModuleRegistry *)moduleRegistry;

- (nonnull NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(nonnull RCTBridge *)bridge
__deprecated_msg("Expo modules are now being automatically registered. You can replace it with an empty array.");

@end
