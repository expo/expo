// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI7_0_0RCTBridgeModule.h"
#import "ABI7_0_0RCTExceptionsManager.h"

@interface ABI7_0_0EXFrameExceptionsManager : NSObject <ABI7_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI7_0_0RCTExceptionsManagerDelegate>)delegate;

@end
