// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI45_0_0React/ABI45_0_0RCTBridgeModule.h>

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXModuleRegistry.h>

@interface ABI45_0_0EXModuleRegistryHolderReactModule : NSObject <ABI45_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI45_0_0EXModuleRegistry *)moduleRegistry;
- (ABI45_0_0EXModuleRegistry *)exModuleRegistry;

@end
