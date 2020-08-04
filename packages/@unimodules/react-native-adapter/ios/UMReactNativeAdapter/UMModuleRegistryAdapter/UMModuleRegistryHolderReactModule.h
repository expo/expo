// Copyright 2018-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMModuleRegistry.h>
#import <React/RCTBridgeModule.h>

@interface UMModuleRegistryHolderReactModule : NSObject <RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(UMModuleRegistry *)moduleRegistry;
- (UMModuleRegistry *)moduleRegistry;

@end
