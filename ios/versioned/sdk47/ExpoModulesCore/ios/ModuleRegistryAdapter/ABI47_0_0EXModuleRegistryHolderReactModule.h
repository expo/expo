// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0React/ABI47_0_0RCTBridgeModule.h>

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistry.h>

@interface ABI47_0_0EXModuleRegistryHolderReactModule : NSObject <ABI47_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry;
- (ABI47_0_0EXModuleRegistry *)exModuleRegistry;

@end
