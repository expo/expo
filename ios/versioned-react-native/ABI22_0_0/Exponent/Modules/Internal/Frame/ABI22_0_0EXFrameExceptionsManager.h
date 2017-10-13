// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI22_0_0/ABI22_0_0RCTBridgeModule.h>
#import <ReactABI22_0_0/ABI22_0_0RCTExceptionsManager.h>

@interface ABI22_0_0EXFrameExceptionsManager : NSObject <ABI22_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI22_0_0RCTExceptionsManagerDelegate>)delegate;

@end
