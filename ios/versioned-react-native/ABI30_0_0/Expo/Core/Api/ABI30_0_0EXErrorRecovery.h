// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI30_0_0EXScopedBridgeModule.h"
#import "ABI30_0_0EXScopedModuleRegistry.h"


@protocol ABI30_0_0EXErrorRecoveryScopedModuleDelegate

- (void)setDeveloperInfo:(NSDictionary *)developerInfo forScopedModule:(id)scopedModule;

@end

@interface ABI30_0_0EXErrorRecovery : ABI30_0_0EXScopedBridgeModule

@end
