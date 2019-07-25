// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistry.h>

#import <ReactABI34_0_0/ABI34_0_0RCTBridgeModule.h>

#import "ABI34_0_0EXScopedModuleRegistry.h"

@interface ABI34_0_0EXScopedModuleRegistry (ModuleRegistry)

@property (nonatomic, readonly) ABI34_0_0UMModuleRegistry *moduleRegistry;

@end

@interface ABI34_0_0EXModuleRegistryBinding : NSObject <ABI34_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI34_0_0UMModuleRegistry *)moduleRegistry;
- (ABI34_0_0UMModuleRegistry *)moduleRegistry;

@end
