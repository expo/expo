// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI11_0_0RCTBridgeModule.h"
#import "ABI11_0_0RCTExceptionsManager.h"

@interface ABI11_0_0EXFrameExceptionsManager : NSObject <ABI11_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI11_0_0RCTExceptionsManagerDelegate>)delegate;

@end
