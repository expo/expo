// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI25_0_0EXScopedBridgeModule.h"

@protocol ABI25_0_0EXGoogleScopedModuleDelegate

- (void)googleModule:(id)scopedGoogleModule didBeginOAuthFlow:(id)authorizationFlowSession;

@end

@interface ABI25_0_0EXGoogle : ABI25_0_0EXScopedBridgeModule

@end
