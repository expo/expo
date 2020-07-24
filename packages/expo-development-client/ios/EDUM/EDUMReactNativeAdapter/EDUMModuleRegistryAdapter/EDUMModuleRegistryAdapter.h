// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>
#import <EDUMModuleRegistryProvider.h>

// An "adapter" over module registry, for given RCTBridge and NSString
// is able to provide an array of exported RCTBridgeModules. Override
// it and use in your AppDelegate to export different bridge modules
// for different experiences.

@interface EDUMModuleRegistryAdapter : NSObject

@property (nonatomic, readonly) EDUMModuleRegistryProvider *moduleRegistryProvider;

- (instancetype)initWithModuleRegistryProvider:(EDUMModuleRegistryProvider *)moduleRegistryProvider;
- (NSArray<id<RCTBridgeModule>> *)extraModulesForModuleRegistry:(EDUMModuleRegistry *)moduleRegistry;
- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge;

@end

