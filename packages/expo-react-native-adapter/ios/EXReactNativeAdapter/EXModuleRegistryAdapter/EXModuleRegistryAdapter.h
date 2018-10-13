// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <EXCore/EXModuleRegistryProvider.h>

// An "adapter" over module registry, for given RCTBridge and NSString
// is able to provide an array of exported RCTBridgeModules. Override
// it and use in your AppDelegate to export different bridge modules
// for different experiences.

@interface EXModuleRegistryAdapter : NSObject

@property (nonatomic, readonly) EXModuleRegistryProvider *moduleRegistryProvider;

- (instancetype)initWithModuleRegistryProvider:(EXModuleRegistryProvider *)moduleRegistryProvider;
- (NSArray<id<RCTBridgeModule>> *)extraModulesForModuleRegistry:(EXModuleRegistry *)moduleRegistry;
- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge andExperience:(NSString *)experienceId;

@end

