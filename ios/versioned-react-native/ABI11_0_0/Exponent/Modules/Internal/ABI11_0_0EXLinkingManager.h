// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#import "ABI11_0_0RCTBridgeModule.h"
#import "ABI11_0_0RCTEventEmitter.h"

@interface ABI11_0_0EXLinkingManager : ABI11_0_0RCTEventEmitter

- (instancetype)initWithInitialUrl: (NSURL *)initialUrl;
- (void)dispatchOpenUrlEvent: (NSURL *)url;

@end
