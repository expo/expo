// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ReactABI29_0_0/ABI29_0_0RCTBridgeModule.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXModuleRegistryProvider.h>

// An "adapter" over module registry, for given ABI29_0_0RCTBridge and NSString
// is able to provide an array of exported ABI29_0_0RCTBridgeModules. Override
// it and use in your AppDelegate to export different bridge modules
// for different experiences.

@interface ABI29_0_0EXModuleRegistryAdapter : NSObject

@property (nonatomic, readonly) ABI29_0_0EXModuleRegistryProvider *moduleRegistryProvider;

- (instancetype)initWithModuleRegistryProvider:(ABI29_0_0EXModuleRegistryProvider *)moduleRegistryProvider;
- (NSArray<id<ABI29_0_0RCTBridgeModule>> *)extraModulesForModuleRegistry:(ABI29_0_0EXModuleRegistry *)moduleRegistry;
- (NSArray<id<ABI29_0_0RCTBridgeModule>> *)extraModulesForBridge:(ABI29_0_0RCTBridge *)bridge andExperience:(NSString *)experienceId;

@end

