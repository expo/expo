// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistry.h>
#import <ABI40_0_0React/ABI40_0_0RCTBridgeModule.h>

@interface ABI40_0_0UMModuleRegistryHolderReactModule : NSObject <ABI40_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI40_0_0UMModuleRegistry *)moduleRegistry;
- (ABI40_0_0UMModuleRegistry *)moduleRegistry;

@end
