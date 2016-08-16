// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI8_0_0RCTBridgeModule.h"
#import "ABI8_0_0RCTExceptionsManager.h"

@interface ABI8_0_0EXFrameExceptionsManager : NSObject <ABI8_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI8_0_0RCTExceptionsManagerDelegate>)delegate;

@end
