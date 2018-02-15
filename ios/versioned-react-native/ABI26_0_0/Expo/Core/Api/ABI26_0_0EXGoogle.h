// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI26_0_0EXScopedBridgeModule.h"

@protocol ABI26_0_0EXGoogleScopedModuleDelegate

- (void)googleModule:(id)scopedGoogleModule didBeginOAuthFlow:(id)authorizationFlowSession;

@end

@interface ABI26_0_0EXGoogle : ABI26_0_0EXScopedBridgeModule

@end
