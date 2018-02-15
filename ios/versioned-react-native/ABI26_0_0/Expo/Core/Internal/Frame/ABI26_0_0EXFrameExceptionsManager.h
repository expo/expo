// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI26_0_0/ABI26_0_0RCTBridgeModule.h>
#import <ReactABI26_0_0/ABI26_0_0RCTExceptionsManager.h>

@interface ABI26_0_0EXFrameExceptionsManager : NSObject <ABI26_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI26_0_0RCTExceptionsManagerDelegate>)delegate;

@end
