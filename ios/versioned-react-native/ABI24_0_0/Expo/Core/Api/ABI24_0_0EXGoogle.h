// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI24_0_0EXScopedBridgeModule.h"

@protocol ABI24_0_0EXGoogleScopedModuleDelegate

- (void)googleModule:(id)scopedGoogleModule didBeginOAuthFlow:(id)authorizationFlowSession;

@end

@interface ABI24_0_0EXGoogle : ABI24_0_0EXScopedBridgeModule

@end
