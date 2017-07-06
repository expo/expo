// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScopedBridgeModule.h"
#import "EXScopedModuleRegistry.h"

@interface EXConstants : EXScopedBridgeModule

+ (NSString *)getExpoClientVersion;

@property (nonatomic, readonly) NSString *appOwnership;

@end

EX_DECLARE_SCOPED_MODULE(EXConstants, constants)
