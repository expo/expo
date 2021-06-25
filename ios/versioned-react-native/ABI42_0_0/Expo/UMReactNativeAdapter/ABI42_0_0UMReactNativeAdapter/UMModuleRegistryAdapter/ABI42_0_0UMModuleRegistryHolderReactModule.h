// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMModuleRegistry.h>
#import <ABI42_0_0React/ABI42_0_0RCTBridgeModule.h>

@interface ABI42_0_0UMModuleRegistryHolderReactModule : NSObject <ABI42_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry;
- (ABI42_0_0UMModuleRegistry *)umModuleRegistry;

@end
