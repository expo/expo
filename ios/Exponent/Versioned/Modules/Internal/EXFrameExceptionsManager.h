// Copyright 2015-present 650 Industries. All rights reserved.

#import "RCTBridgeModule.h"
#import "RCTExceptionsManager.h"

@interface EXFrameExceptionsManager : NSObject <RCTBridgeModule>

- (instancetype)initWithDelegate:(id<RCTExceptionsManagerDelegate>)delegate;

@end
