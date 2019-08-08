// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMModuleRegistry.h>

#import <React/RCTBridgeModule.h>

#import "EXScopedModuleRegistry.h"

@interface EXScopedModuleRegistry (ModuleRegistry)

@property (nonatomic, readonly) UMModuleRegistry *moduleRegistry;

@end

@interface EXModuleRegistryBinding : NSObject <RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(UMModuleRegistry *)moduleRegistry;
- (UMModuleRegistry *)moduleRegistry;

@end
