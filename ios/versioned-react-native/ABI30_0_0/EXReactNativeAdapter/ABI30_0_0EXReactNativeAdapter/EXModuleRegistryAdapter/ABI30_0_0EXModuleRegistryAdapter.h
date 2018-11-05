// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ReactABI30_0_0/ABI30_0_0RCTBridgeModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryProvider.h>

// An "adapter" over module registry, for given ABI30_0_0RCTBridge and NSString
// is able to provide an array of exported ABI30_0_0RCTBridgeModules. Override
// it and use in your AppDelegate to export different bridge modules
// for different experiences.

@interface ABI30_0_0EXModuleRegistryAdapter : NSObject

@property (nonatomic, readonly) ABI30_0_0EXModuleRegistryProvider *moduleRegistryProvider;

- (instancetype)initWithModuleRegistryProvider:(ABI30_0_0EXModuleRegistryProvider *)moduleRegistryProvider;
- (NSArray<id<ABI30_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry;
- (NSArray<id<ABI30_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI30_0_0RCTBridge *)bridge andExperience:(NSString *)experienceId;

@end

