// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

#import <ExpoModulesCore/EXModuleRegistry.h>

@interface EXModuleRegistryHolderReactModule : NSObject <RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry;
- (EXModuleRegistry *)exModuleRegistry;

@end
