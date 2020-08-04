// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI38_0_0React/ABI38_0_0RCTBridgeModule.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistryProvider.h>

// An "adapter" over module registry, for given ABI38_0_0RCTBridge and NSString
// is able to provide an array of exported ABI38_0_0RCTBridgeModules. Override
// it and use in your AppDelegate to export different bridge modules
// for different experiences.

@interface ABI38_0_0UMModuleRegistryAdapter : NSObject

@property (nonatomic, readonly) ABI38_0_0UMModuleRegistryProvider *moduleRegistryProvider;

- (instancetype)initWithModuleRegistryProvider:(ABI38_0_0UMModuleRegistryProvider *)moduleRegistryProvider;
- (NSArray<id<ABI38_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI38_0_0UMModuleRegistry *)moduleRegistry;
- (NSArray<id<ABI38_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI38_0_0RCTBridge *)bridge;

@end

