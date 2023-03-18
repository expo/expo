// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXModuleRegistry.h>

@interface ABI48_0_0EXModuleRegistryHolderReactModule : NSObject <ABI48_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI48_0_0EXModuleRegistry *)moduleRegistry;
- (ABI48_0_0EXModuleRegistry *)exModuleRegistry;

@end
