// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI23_0_0EXScopedBridgeModule.h"
#import "ABI23_0_0EXScopedModuleRegistry.h"

@interface ABI23_0_0EXConstants : ABI23_0_0EXScopedBridgeModule

@property (nonatomic, readonly) NSString *appOwnership;

@end

ABI23_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI23_0_0EXConstants, constants)
