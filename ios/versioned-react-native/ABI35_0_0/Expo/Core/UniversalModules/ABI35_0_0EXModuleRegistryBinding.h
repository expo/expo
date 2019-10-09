// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistry.h>

#import <ReactABI35_0_0/ABI35_0_0RCTBridgeModule.h>

#import "ABI35_0_0EXScopedModuleRegistry.h"

@interface ABI35_0_0EXScopedModuleRegistry (ModuleRegistry)

@property (nonatomic, readonly) ABI35_0_0UMModuleRegistry *moduleRegistry;

@end

@interface ABI35_0_0EXModuleRegistryBinding : NSObject <ABI35_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI35_0_0UMModuleRegistry *)moduleRegistry;
- (ABI35_0_0UMModuleRegistry *)moduleRegistry;

@end
