// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistry.h>

#import <ReactABI33_0_0/ABI33_0_0RCTBridgeModule.h>

#import "ABI33_0_0EXScopedModuleRegistry.h"

@interface ABI33_0_0EXScopedModuleRegistry (ModuleRegistry)

@property (nonatomic, readonly) ABI33_0_0UMModuleRegistry *moduleRegistry;

@end

@interface ABI33_0_0EXModuleRegistryBinding : NSObject <ABI33_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI33_0_0UMModuleRegistry *)moduleRegistry;
- (ABI33_0_0UMModuleRegistry *)moduleRegistry;

@end
