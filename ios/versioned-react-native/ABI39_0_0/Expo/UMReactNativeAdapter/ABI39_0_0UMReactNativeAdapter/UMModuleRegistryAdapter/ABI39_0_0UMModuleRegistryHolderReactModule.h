// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistry.h>
#import <ABI39_0_0React/ABI39_0_0RCTBridgeModule.h>

@interface ABI39_0_0UMModuleRegistryHolderReactModule : NSObject <ABI39_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI39_0_0UMModuleRegistry *)moduleRegistry;
- (ABI39_0_0UMModuleRegistry *)moduleRegistry;

@end
