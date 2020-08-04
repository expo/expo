// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI38_0_0UMCore/ABI38_0_0UMModuleRegistry.h>
#import <ABI38_0_0React/ABI38_0_0RCTBridgeModule.h>

@interface ABI38_0_0UMModuleRegistryHolderReactModule : NSObject <ABI38_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI38_0_0UMModuleRegistry *)moduleRegistry;
- (ABI38_0_0UMModuleRegistry *)moduleRegistry;

@end
