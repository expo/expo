// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI41_0_0React/ABI41_0_0RCTBridgeModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistryProvider.h>

// An "adapter" over module registry, for given ABI41_0_0RCTBridge and NSString
// is able to provide an array of exported ABI41_0_0RCTBridgeModules. Override
// it and use in your AppDelegate to export different bridge modules
// for different experiences.

@interface ABI41_0_0UMModuleRegistryAdapter : NSObject

@property (nonatomic, readonly) ABI41_0_0UMModuleRegistryProvider *moduleRegistryProvider;

- (instancetype)initWithModuleRegistryProvider:(ABI41_0_0UMModuleRegistryProvider *)moduleRegistryProvider;
- (NSArray<id<ABI41_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry;
- (NSArray<id<ABI41_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI41_0_0RCTBridge *)bridge;

@end

