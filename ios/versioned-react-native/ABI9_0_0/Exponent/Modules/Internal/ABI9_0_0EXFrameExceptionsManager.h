// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI9_0_0RCTBridgeModule.h"
#import "ABI9_0_0RCTExceptionsManager.h"

@interface ABI9_0_0EXFrameExceptionsManager : NSObject <ABI9_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI9_0_0RCTExceptionsManagerDelegate>)delegate;

@end
