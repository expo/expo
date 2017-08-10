// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI20_0_0/ABI20_0_0RCTBridgeModule.h>
#import <ReactABI20_0_0/ABI20_0_0RCTExceptionsManager.h>

@interface ABI20_0_0EXFrameExceptionsManager : NSObject <ABI20_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI20_0_0RCTExceptionsManagerDelegate>)delegate;

@end
