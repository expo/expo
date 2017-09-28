// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXScopedBridgeModule.h"
#import "ABI21_0_0EXScopedModuleRegistry.h"

@interface ABI21_0_0EXConstants : ABI21_0_0EXScopedBridgeModule

@property (nonatomic, readonly) NSString *appOwnership;

@end

ABI21_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI21_0_0EXConstants, constants)
