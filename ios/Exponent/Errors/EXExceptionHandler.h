// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTExceptionsManager.h>

@interface EXExceptionHandler : NSObject <RCTExceptionsManagerDelegate>

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end
