// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI19_0_0/ABI19_0_0RCTBridgeModule.h>
#import <ReactABI19_0_0/ABI19_0_0RCTExceptionsManager.h>

@interface ABI19_0_0EXFrameExceptionsManager : NSObject <ABI19_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI19_0_0RCTExceptionsManagerDelegate>)delegate;

@end
