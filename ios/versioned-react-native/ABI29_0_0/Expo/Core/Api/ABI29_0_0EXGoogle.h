// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI29_0_0EXScopedBridgeModule.h"

@protocol ABI29_0_0EXGoogleScopedModuleDelegate

- (void)googleModule:(id)scopedGoogleModule didBeginOAuthFlow:(id)authorizationFlowSession;

@end

@interface ABI29_0_0EXGoogle : ABI29_0_0EXScopedBridgeModule

@end
