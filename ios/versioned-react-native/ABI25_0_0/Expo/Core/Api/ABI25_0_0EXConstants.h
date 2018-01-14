// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI25_0_0EXScopedBridgeModule.h"
#import "ABI25_0_0EXScopedModuleRegistry.h"

@interface ABI25_0_0EXConstants : ABI25_0_0EXScopedBridgeModule

@property (nonatomic, readonly) NSString *appOwnership;

@end

ABI25_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI25_0_0EXConstants, constants)
