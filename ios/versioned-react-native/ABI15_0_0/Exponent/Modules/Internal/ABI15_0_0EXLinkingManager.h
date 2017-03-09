// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#import <ReactABI15_0_0/ABI15_0_0RCTBridgeModule.h>
#import <ReactABI15_0_0/ABI15_0_0RCTEventEmitter.h>

@interface ABI15_0_0EXLinkingManager : ABI15_0_0RCTEventEmitter

- (instancetype)initWithInitialUrl: (NSURL *)initialUrl;
- (void)dispatchOpenUrlEvent: (NSURL *)url;

@end
