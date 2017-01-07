// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI13_0_0/ABI13_0_0RCTBridgeModule.h>
#import <ReactABI13_0_0/ABI13_0_0RCTExceptionsManager.h>

@interface ABI13_0_0EXFrameExceptionsManager : NSObject <ABI13_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI13_0_0RCTExceptionsManagerDelegate>)delegate;

@end
