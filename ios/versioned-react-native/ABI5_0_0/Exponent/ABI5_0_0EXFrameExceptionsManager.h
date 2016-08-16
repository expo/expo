// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI5_0_0RCTBridgeModule.h"
#import "ABI5_0_0RCTExceptionsManager.h"

@interface ABI5_0_0EXFrameExceptionsManager : NSObject <ABI5_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI5_0_0RCTExceptionsManagerDelegate>)delegate;

@end
