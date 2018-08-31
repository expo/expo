// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI30_0_0EXScopedBridgeModule.h"

@protocol ABI30_0_0EXGoogleScopedModuleDelegate

- (void)googleModule:(id)scopedGoogleModule didBeginOAuthFlow:(id)authorizationFlowSession;

@end

@interface ABI30_0_0EXGoogle : ABI30_0_0EXScopedBridgeModule

@end
