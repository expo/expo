// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI23_0_0/ABI23_0_0RCTBridgeModule.h>
#import <ReactABI23_0_0/ABI23_0_0RCTExceptionsManager.h>

@interface ABI23_0_0EXFrameExceptionsManager : NSObject <ABI23_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI23_0_0RCTExceptionsManagerDelegate>)delegate;

@end
