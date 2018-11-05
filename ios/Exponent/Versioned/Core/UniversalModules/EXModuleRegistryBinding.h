// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXModuleRegistry.h>

#import <React/RCTBridgeModule.h>

#import "EXScopedModuleRegistry.h"

@interface EXScopedModuleRegistry (ModuleRegistry)

@property (nonatomic, readonly) EXModuleRegistry *moduleRegistry;

@end

@interface EXModuleRegistryBinding : NSObject <RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry;
- (EXModuleRegistry *)moduleRegistry;

@end
