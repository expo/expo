// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI25_0_0EXScopedBridgeModule.h"
#import "ABI25_0_0EXScopedModuleRegistry.h"


@protocol ABI25_0_0EXErrorRecoveryScopedModuleDelegate

- (void)setDeveloperInfo:(NSDictionary *)developerInfo forScopedModule:(id)scopedModule;

@end

@interface ABI25_0_0EXErrorRecovery : ABI25_0_0EXScopedBridgeModule

@end
