// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistryProvider.h>

// An "adapter" over module registry, for given ABI48_0_0RCTBridge and NSString
// is able to provide an array of exported ABI48_0_0RCTBridgeModules. Override
// it and use in your AppDelegate to export different bridge modules
// for different experiences.

NS_SWIFT_NAME(ModuleRegistryAdapter)
@interface ABI48_0_0EXModuleRegistryAdapter : NSObject

@property (nonnull, nonatomic, readonly) ABI48_0_0EXModuleRegistryProvider *moduleRegistryProvider;

- (instancetype)initWithModuleRegistryProvider:(nonnull ABI48_0_0EXModuleRegistryProvider *)moduleRegistryProvider
__deprecated_msg("Expo modules are now automatically registered. You can remove this method call.");

- (nonnull NSArray<id<ABI48_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(nonnull ABI48_0_0EXModuleRegistry *)moduleRegistry;

- (nonnull NSArray<id<ABI48_0_0RCTBridgeModule>> *)extraModulesForBridge:(nonnull ABI48_0_0RCTBridge *)bridge
__deprecated_msg("Expo modules are now automatically registered. You can replace this with an empty array.");

@end
