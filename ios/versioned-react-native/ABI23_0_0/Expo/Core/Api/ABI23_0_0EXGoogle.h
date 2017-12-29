// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI23_0_0EXScopedBridgeModule.h"

@protocol ABI23_0_0EXGoogleScopedModuleDelegate

- (void)googleModule:(id)scopedGoogleModule didBeginOAuthFlow:(id)authorizationFlowSession;

@end

@interface ABI23_0_0EXGoogle : ABI23_0_0EXScopedBridgeModule

@end
