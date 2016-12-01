// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI12_0_0RCTBridgeModule.h"
#import "ABI12_0_0RCTExceptionsManager.h"

@interface ABI12_0_0EXFrameExceptionsManager : NSObject <ABI12_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI12_0_0RCTExceptionsManagerDelegate>)delegate;

@end
