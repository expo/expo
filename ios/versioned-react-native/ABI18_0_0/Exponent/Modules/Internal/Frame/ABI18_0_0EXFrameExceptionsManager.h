// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI18_0_0/ABI18_0_0RCTBridgeModule.h>
#import <ReactABI18_0_0/ABI18_0_0RCTExceptionsManager.h>

@interface ABI18_0_0EXFrameExceptionsManager : NSObject <ABI18_0_0RCTBridgeModule>

- (instancetype)initWithDelegate:(id<ABI18_0_0RCTExceptionsManagerDelegate>)delegate;

@end
