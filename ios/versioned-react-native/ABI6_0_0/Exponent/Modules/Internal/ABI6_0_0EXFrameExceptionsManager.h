// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI6_0_0RCTBridgeModule.h"
#import "ABI6_0_0RCTExceptionsManager.h"

@interface ABI6_0_0EXFrameExceptionsManager : NSObject <ABI6_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI6_0_0RCTExceptionsManagerDelegate>)delegate;

@end
