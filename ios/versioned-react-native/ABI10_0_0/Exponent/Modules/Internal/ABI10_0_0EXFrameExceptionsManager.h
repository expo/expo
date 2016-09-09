// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI10_0_0RCTBridgeModule.h"
#import "ABI10_0_0RCTExceptionsManager.h"

@interface ABI10_0_0EXFrameExceptionsManager : NSObject <ABI10_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI10_0_0RCTExceptionsManagerDelegate>)delegate;

@end
