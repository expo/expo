// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI15_0_0/ABI15_0_0RCTBridgeModule.h>
#import <ReactABI15_0_0/ABI15_0_0RCTExceptionsManager.h>

@interface ABI15_0_0EXFrameExceptionsManager : NSObject <ABI15_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI15_0_0RCTExceptionsManagerDelegate>)delegate;

@end
