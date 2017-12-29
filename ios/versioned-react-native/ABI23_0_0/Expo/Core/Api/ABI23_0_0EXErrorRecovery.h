// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI23_0_0EXScopedBridgeModule.h"
#import "ABI23_0_0EXScopedModuleRegistry.h"


@protocol ABI23_0_0EXErrorRecoveryScopedModuleDelegate

- (void)setDeveloperInfo:(NSDictionary *)developerInfo forScopedModule:(id)scopedModule;

@end

@interface ABI23_0_0EXErrorRecovery : ABI23_0_0EXScopedBridgeModule

@end
