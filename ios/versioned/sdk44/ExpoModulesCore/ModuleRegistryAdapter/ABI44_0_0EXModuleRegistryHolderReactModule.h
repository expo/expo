// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0React/ABI44_0_0RCTBridgeModule.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXModuleRegistry.h>

@interface ABI44_0_0EXModuleRegistryHolderReactModule : NSObject <ABI44_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI44_0_0EXModuleRegistry *)moduleRegistry;
- (ABI44_0_0EXModuleRegistry *)exModuleRegistry;

@end
