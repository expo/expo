// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistry.h>

#import <ReactABI30_0_0/ABI30_0_0RCTBridgeModule.h>

#import "ABI30_0_0EXScopedModuleRegistry.h"

@interface ABI30_0_0EXScopedModuleRegistry (ModuleRegistry)

@property (nonatomic, readonly) ABI30_0_0EXModuleRegistry *moduleRegistry;

@end

@interface ABI30_0_0EXModuleRegistryBinding : NSObject <ABI30_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry;
- (ABI30_0_0EXModuleRegistry *)moduleRegistry;

@end
