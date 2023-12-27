// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0React/ABI43_0_0RCTBridgeModule.h>

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistry.h>

@interface ABI43_0_0EXModuleRegistryHolderReactModule : NSObject <ABI43_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry;
- (ABI43_0_0EXModuleRegistry *)exModuleRegistry;

@end
