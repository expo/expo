// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0React/ABI47_0_0RCTBridgeModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistryProvider.h>

// An "adapter" over module registry, for given ABI47_0_0RCTBridge and NSString
// is able to provide an array of exported ABI47_0_0RCTBridgeModules. Override
// it and use in your AppDelegate to export different bridge modules
// for different experiences.

NS_SWIFT_NAME(ModuleRegistryAdapter)
@interface ABI47_0_0EXModuleRegistryAdapter : NSObject

@property (nonnull, nonatomic, readonly) ABI47_0_0EXModuleRegistryProvider *moduleRegistryProvider;

- (instancetype)initWithModuleRegistryProvider:(nonnull ABI47_0_0EXModuleRegistryProvider *)moduleRegistryProvider
__deprecated_msg("Expo modules are now automatically registered. You can remove this method call.");

- (nonnull NSArray<id<ABI47_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(nonnull ABI47_0_0EXModuleRegistry *)moduleRegistry;

- (nonnull NSArray<id<ABI47_0_0RCTBridgeModule>> *)extraModulesForBridge:(nonnull ABI47_0_0RCTBridge *)bridge
__deprecated_msg("Expo modules are now automatically registered. You can replace this with an empty array.");

@end
