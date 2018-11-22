// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ReactABI31_0_0/ABI31_0_0RCTBridgeModule.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistryProvider.h>

// An "adapter" over module registry, for given ABI31_0_0RCTBridge and NSString
// is able to provide an array of exported ABI31_0_0RCTBridgeModules. Override
// it and use in your AppDelegate to export different bridge modules
// for different experiences.

@interface ABI31_0_0EXModuleRegistryAdapter : NSObject

@property (nonatomic, readonly) ABI31_0_0EXModuleRegistryProvider *moduleRegistryProvider;

- (instancetype)initWithModuleRegistryProvider:(ABI31_0_0EXModuleRegistryProvider *)moduleRegistryProvider;
- (NSArray<id<ABI31_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI31_0_0EXModuleRegistry *)moduleRegistry;
- (NSArray<id<ABI31_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI31_0_0RCTBridge *)bridge andExperience:(NSString *)experienceId;

@end

