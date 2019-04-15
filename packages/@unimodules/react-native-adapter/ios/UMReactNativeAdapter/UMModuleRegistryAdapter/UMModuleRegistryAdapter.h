// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <UMCore/UMModuleRegistryProvider.h>

// An "adapter" over module registry, for given RCTBridge and NSString
// is able to provide an array of exported RCTBridgeModules. Override
// it and use in your AppDelegate to export different bridge modules
// for different experiences.

@interface UMModuleRegistryAdapter : NSObject

@property (nonatomic, readonly) UMModuleRegistryProvider *moduleRegistryProvider;

- (instancetype)initWithModuleRegistryProvider:(UMModuleRegistryProvider *)moduleRegistryProvider;
- (NSArray<id<RCTBridgeModule>> *)extraModulesForModuleRegistry:(UMModuleRegistry *)moduleRegistry;
- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge;

@end

