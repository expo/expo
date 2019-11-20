// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistry.h>

#import <ABI36_0_0React/ABI36_0_0RCTBridgeModule.h>

#import "ABI36_0_0EXScopedModuleRegistry.h"

@interface ABI36_0_0EXScopedModuleRegistry (ModuleRegistry)

@property (nonatomic, readonly) ABI36_0_0UMModuleRegistry *moduleRegistry;

@end

@interface ABI36_0_0EXModuleRegistryBinding : NSObject <ABI36_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI36_0_0UMModuleRegistry *)moduleRegistry;
- (ABI36_0_0UMModuleRegistry *)moduleRegistry;

@end
