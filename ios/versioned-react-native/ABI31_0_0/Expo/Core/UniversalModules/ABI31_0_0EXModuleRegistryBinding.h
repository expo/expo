// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistry.h>

#import <ReactABI31_0_0/ABI31_0_0RCTBridgeModule.h>

#import "ABI31_0_0EXScopedModuleRegistry.h"

@interface ABI31_0_0EXScopedModuleRegistry (ModuleRegistry)

@property (nonatomic, readonly) ABI31_0_0EXModuleRegistry *moduleRegistry;

@end

@interface ABI31_0_0EXModuleRegistryBinding : NSObject <ABI31_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI31_0_0EXModuleRegistry *)moduleRegistry;
- (ABI31_0_0EXModuleRegistry *)moduleRegistry;

@end
