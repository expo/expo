// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EDUMModuleRegistry.h>
#import <React/RCTBridgeModule.h>

@interface EDUMModuleRegistryHolderReactModule : NSObject <RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(EDUMModuleRegistry *)moduleRegistry;
- (EDUMModuleRegistry *)moduleRegistry;

@end
