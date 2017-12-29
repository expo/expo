// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXScopedBridgeModule.h"
#import "ABI21_0_0EXScopedModuleRegistry.h"


@protocol ABI21_0_0EXErrorRecoveryScopedModuleDelegate

- (void)setDeveloperInfo:(NSDictionary *)developerInfo forScopedModule:(id)scopedModule;

@end

@interface ABI21_0_0EXErrorRecovery : ABI21_0_0EXScopedBridgeModule

@end
