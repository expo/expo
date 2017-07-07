// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXScopedBridgeModule.h"

@protocol EXGoogleScopedModuleDelegate

- (void)googleModule:(id)scopedGoogleModule didBeginOAuthFlow:(id)authorizationFlowSession;

@end

@interface EXGoogle : EXScopedBridgeModule

@end
