// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI21_0_0/ABI21_0_0RCTBridgeModule.h>
#import <ReactABI21_0_0/ABI21_0_0RCTExceptionsManager.h>

@interface ABI21_0_0EXFrameExceptionsManager : NSObject <ABI21_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI21_0_0RCTExceptionsManagerDelegate>)delegate;

@end
