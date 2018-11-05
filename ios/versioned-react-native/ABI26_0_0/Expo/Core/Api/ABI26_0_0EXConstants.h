// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI26_0_0EXScopedBridgeModule.h"
#import "ABI26_0_0EXScopedModuleRegistry.h"

@interface ABI26_0_0EXConstants : ABI26_0_0EXScopedBridgeModule

@property (nonatomic, readonly) NSString *appOwnership;

@end

ABI26_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI26_0_0EXConstants, constants)
