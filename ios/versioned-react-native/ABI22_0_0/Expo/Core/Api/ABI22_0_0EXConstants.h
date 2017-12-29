// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI22_0_0EXScopedBridgeModule.h"
#import "ABI22_0_0EXScopedModuleRegistry.h"

@interface ABI22_0_0EXConstants : ABI22_0_0EXScopedBridgeModule

@property (nonatomic, readonly) NSString *appOwnership;

@end

ABI22_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI22_0_0EXConstants, constants)
