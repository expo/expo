// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistry.h>

#import <ReactABI32_0_0/ABI32_0_0RCTBridgeModule.h>

#import "ABI32_0_0EXScopedModuleRegistry.h"

@interface ABI32_0_0EXScopedModuleRegistry (ModuleRegistry)

@property (nonatomic, readonly) ABI32_0_0EXModuleRegistry *moduleRegistry;

@end

@interface ABI32_0_0EXModuleRegistryBinding : NSObject <ABI32_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI32_0_0EXModuleRegistry *)moduleRegistry;
- (ABI32_0_0EXModuleRegistry *)moduleRegistry;

@end
