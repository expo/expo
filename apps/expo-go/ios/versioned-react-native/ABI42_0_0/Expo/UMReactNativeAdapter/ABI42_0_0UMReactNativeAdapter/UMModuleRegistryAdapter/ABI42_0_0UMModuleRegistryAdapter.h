// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI42_0_0React/ABI42_0_0RCTBridgeModule.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistryProvider.h>

// An "adapter" over module registry, for given ABI42_0_0RCTBridge and NSString
// is able to provide an array of exported ABI42_0_0RCTBridgeModules. Override
// it and use in your AppDelegate to export different bridge modules
// for different experiences.

@interface ABI42_0_0UMModuleRegistryAdapter : NSObject

@property (nonatomic, readonly) ABI42_0_0UMModuleRegistryProvider *moduleRegistryProvider;

- (instancetype)initWithModuleRegistryProvider:(ABI42_0_0UMModuleRegistryProvider *)moduleRegistryProvider;
- (NSArray<id<ABI42_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry;
- (NSArray<id<ABI42_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI42_0_0RCTBridge *)bridge;

@end

