// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI40_0_0React/ABI40_0_0RCTBridgeModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryProvider.h>

// An "adapter" over module registry, for given ABI40_0_0RCTBridge and NSString
// is able to provide an array of exported ABI40_0_0RCTBridgeModules. Override
// it and use in your AppDelegate to export different bridge modules
// for different experiences.

@interface ABI40_0_0UMModuleRegistryAdapter : NSObject

@property (nonatomic, readonly) ABI40_0_0UMModuleRegistryProvider *moduleRegistryProvider;

- (instancetype)initWithModuleRegistryProvider:(ABI40_0_0UMModuleRegistryProvider *)moduleRegistryProvider;
- (NSArray<id<ABI40_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI40_0_0UMModuleRegistry *)moduleRegistry;
- (NSArray<id<ABI40_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI40_0_0RCTBridge *)bridge;

@end

