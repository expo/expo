// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistry.h>

@interface ABI49_0_0EXModuleRegistryHolderReactModule : NSObject <ABI49_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI49_0_0EXModuleRegistry *)moduleRegistry;
- (ABI49_0_0EXModuleRegistry *)exModuleRegistry;

@end
