// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ReactABI35_0_0/ABI35_0_0RCTBridgeModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryProvider.h>

// An "adapter" over module registry, for given ABI35_0_0RCTBridge and NSString
// is able to provide an array of exported ABI35_0_0RCTBridgeModules. Override
// it and use in your AppDelegate to export different bridge modules
// for different experiences.

@interface ABI35_0_0UMModuleRegistryAdapter : NSObject

@property (nonatomic, readonly) ABI35_0_0UMModuleRegistryProvider *moduleRegistryProvider;

- (instancetype)initWithModuleRegistryProvider:(ABI35_0_0UMModuleRegistryProvider *)moduleRegistryProvider;
- (NSArray<id<ABI35_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI35_0_0UMModuleRegistry *)moduleRegistry;
- (NSArray<id<ABI35_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI35_0_0RCTBridge *)bridge;

@end

