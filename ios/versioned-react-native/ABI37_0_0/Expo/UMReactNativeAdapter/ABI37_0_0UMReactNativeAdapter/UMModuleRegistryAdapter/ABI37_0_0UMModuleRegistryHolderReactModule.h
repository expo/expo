// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistry.h>
#import <ABI37_0_0React/ABI37_0_0RCTBridgeModule.h>

@interface ABI37_0_0UMModuleRegistryHolderReactModule : NSObject <ABI37_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry;
- (ABI37_0_0UMModuleRegistry *)moduleRegistry;

@end
