// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ReactABI34_0_0/ABI34_0_0RCTBridgeModule.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryProvider.h>

// An "adapter" over module registry, for given ABI34_0_0RCTBridge and NSString
// is able to provide an array of exported ABI34_0_0RCTBridgeModules. Override
// it and use in your AppDelegate to export different bridge modules
// for different experiences.

@interface ABI34_0_0UMModuleRegistryAdapter : NSObject

@property (nonatomic, readonly) ABI34_0_0UMModuleRegistryProvider *moduleRegistryProvider;

- (instancetype)initWithModuleRegistryProvider:(ABI34_0_0UMModuleRegistryProvider *)moduleRegistryProvider;
- (NSArray<id<ABI34_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry;
- (NSArray<id<ABI34_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI34_0_0RCTBridge *)bridge;

@end

