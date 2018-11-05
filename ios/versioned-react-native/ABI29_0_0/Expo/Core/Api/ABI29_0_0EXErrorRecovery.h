// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI29_0_0EXScopedBridgeModule.h"
#import "ABI29_0_0EXScopedModuleRegistry.h"


@protocol ABI29_0_0EXErrorRecoveryScopedModuleDelegate

- (void)setDeveloperInfo:(NSDictionary *)developerInfo forScopedModule:(id)scopedModule;

@end

@interface ABI29_0_0EXErrorRecovery : ABI29_0_0EXScopedBridgeModule

@end
