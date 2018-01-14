// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI25_0_0/ABI25_0_0RCTBridgeModule.h>
#import <ReactABI25_0_0/ABI25_0_0RCTExceptionsManager.h>

@interface ABI25_0_0EXFrameExceptionsManager : NSObject <ABI25_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI25_0_0RCTExceptionsManagerDelegate>)delegate;

@end
