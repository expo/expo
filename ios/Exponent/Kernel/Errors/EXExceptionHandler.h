// Copyright 2015-present 650 Industries. All rights reserved.
//
//  This class takes the role of RCTExceptionsManagerDelegate for the kernel react bridge only.
//

#import <React/RCTExceptionsManager.h>

@interface EXExceptionHandler : NSObject <RCTExceptionsManagerDelegate>

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end
