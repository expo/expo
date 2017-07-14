// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI19_0_0EXScopedBridgeModule.h"
#import "ABI19_0_0EXScopedModuleRegistry.h"

@interface ABI19_0_0EXConstants : ABI19_0_0EXScopedBridgeModule

+ (NSString *)getExpoClientVersion;

@property (nonatomic, readonly) NSString *appOwnership;

@end

ABI19_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI19_0_0EXConstants, constants)
