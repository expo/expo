// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXScopedBridgeModule.h"

@protocol ABI21_0_0EXGoogleScopedModuleDelegate

- (void)googleModule:(id)scopedGoogleModule didBeginOAuthFlow:(id)authorizationFlowSession;

@end

@interface ABI21_0_0EXGoogle : ABI21_0_0EXScopedBridgeModule

@end
