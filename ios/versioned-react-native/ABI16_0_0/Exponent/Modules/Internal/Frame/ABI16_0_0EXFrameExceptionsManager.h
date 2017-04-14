// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI16_0_0/ABI16_0_0RCTBridgeModule.h>
#import <ReactABI16_0_0/ABI16_0_0RCTExceptionsManager.h>

@interface ABI16_0_0EXFrameExceptionsManager : NSObject <ABI16_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI16_0_0RCTExceptionsManagerDelegate>)delegate;

@end
