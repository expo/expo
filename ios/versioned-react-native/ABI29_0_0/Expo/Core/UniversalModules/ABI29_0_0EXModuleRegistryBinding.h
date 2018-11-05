// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXModuleRegistry.h>

#import <ReactABI29_0_0/ABI29_0_0RCTBridgeModule.h>

#import "ABI29_0_0EXScopedModuleRegistry.h"

@interface ABI29_0_0EXScopedModuleRegistry (ModuleRegistry)

@property (nonatomic, readonly) ABI29_0_0EXModuleRegistry *moduleRegistry;

@end

@interface ABI29_0_0EXModuleRegistryBinding : NSObject <ABI29_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI29_0_0EXModuleRegistry *)moduleRegistry;
- (ABI29_0_0EXModuleRegistry *)moduleRegistry;

@end
