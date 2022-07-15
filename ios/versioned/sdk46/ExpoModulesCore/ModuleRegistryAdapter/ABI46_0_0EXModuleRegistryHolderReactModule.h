// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0React/ABI46_0_0RCTBridgeModule.h>

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistry.h>

@interface ABI46_0_0EXModuleRegistryHolderReactModule : NSObject <ABI46_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI46_0_0EXModuleRegistry *)moduleRegistry;
- (ABI46_0_0EXModuleRegistry *)exModuleRegistry;

@end
