// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistry.h>
#import <ABI41_0_0React/ABI41_0_0RCTBridgeModule.h>

@interface ABI41_0_0UMModuleRegistryHolderReactModule : NSObject <ABI41_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry;
- (ABI41_0_0UMModuleRegistry *)umModuleRegistry;

@end
