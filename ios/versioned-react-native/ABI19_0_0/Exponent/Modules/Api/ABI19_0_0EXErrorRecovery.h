// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI19_0_0EXScopedBridgeModule.h"
#import "ABI19_0_0EXScopedModuleRegistry.h"


@protocol ABI19_0_0EXErrorRecoveryScopedModuleDelegate

- (void)setDeveloperInfo:(NSDictionary *)developerInfo forScopedModule:(id)scopedModule;

@end

@interface ABI19_0_0EXErrorRecovery : ABI19_0_0EXScopedBridgeModule

@end
