// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI39_0_0React/ABI39_0_0RCTBridgeModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryProvider.h>

// An "adapter" over module registry, for given ABI39_0_0RCTBridge and NSString
// is able to provide an array of exported ABI39_0_0RCTBridgeModules. Override
// it and use in your AppDelegate to export different bridge modules
// for different experiences.

@interface ABI39_0_0UMModuleRegistryAdapter : NSObject

@property (nonatomic, readonly) ABI39_0_0UMModuleRegistryProvider *moduleRegistryProvider;

- (instancetype)initWithModuleRegistryProvider:(ABI39_0_0UMModuleRegistryProvider *)moduleRegistryProvider;
- (NSArray<id<ABI39_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI39_0_0UMModuleRegistry *)moduleRegistry;
- (NSArray<id<ABI39_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI39_0_0RCTBridge *)bridge;

@end

