// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI31_0_0EXScopedBridgeModule.h"
#import "ABI31_0_0EXScopedModuleRegistry.h"


@protocol ABI31_0_0EXErrorRecoveryScopedModuleDelegate

- (void)setDeveloperInfo:(NSDictionary *)developerInfo forScopedModule:(id)scopedModule;

@end

@interface ABI31_0_0EXErrorRecovery : ABI31_0_0EXScopedBridgeModule

@end
