// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI33_0_0EXScopedBridgeModule.h"
#import "ABI33_0_0EXScopedModuleRegistry.h"


@protocol ABI33_0_0EXErrorRecoveryScopedModuleDelegate

- (void)setDeveloperInfo:(NSDictionary *)developerInfo forScopedModule:(id)scopedModule;

@end

@interface ABI33_0_0EXErrorRecovery : ABI33_0_0EXScopedBridgeModule

@end
