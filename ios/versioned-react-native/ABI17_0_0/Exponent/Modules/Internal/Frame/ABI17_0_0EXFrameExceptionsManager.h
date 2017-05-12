// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI17_0_0/ABI17_0_0RCTBridgeModule.h>
#import <ReactABI17_0_0/ABI17_0_0RCTExceptionsManager.h>

@interface ABI17_0_0EXFrameExceptionsManager : NSObject <ABI17_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI17_0_0RCTExceptionsManagerDelegate>)delegate;

@end
