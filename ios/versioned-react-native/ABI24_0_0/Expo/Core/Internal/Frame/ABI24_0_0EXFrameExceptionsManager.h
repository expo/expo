// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI24_0_0/ABI24_0_0RCTBridgeModule.h>
#import <ReactABI24_0_0/ABI24_0_0RCTExceptionsManager.h>

@interface ABI24_0_0EXFrameExceptionsManager : NSObject <ABI24_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI24_0_0RCTExceptionsManagerDelegate>)delegate;

@end
