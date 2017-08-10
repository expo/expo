// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI20_0_0EXScopedBridgeModule.h"
#import "ABI20_0_0EXScopedModuleRegistry.h"

@interface ABI20_0_0EXConstants : ABI20_0_0EXScopedBridgeModule

+ (NSString *)getExpoClientVersion;

@property (nonatomic, readonly) NSString *appOwnership;

@end

ABI20_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI20_0_0EXConstants, constants)
