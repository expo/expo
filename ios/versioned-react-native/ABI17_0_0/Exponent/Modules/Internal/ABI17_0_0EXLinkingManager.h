// Copyright 2015-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

#import <ReactABI17_0_0/ABI17_0_0RCTBridgeModule.h>
#import <ReactABI17_0_0/ABI17_0_0RCTEventEmitter.h>

@interface ABI17_0_0EXLinkingManager : ABI17_0_0RCTEventEmitter

- (instancetype)initWithInitialUrl: (NSURL *)initialUrl;
- (void)dispatchOpenUrlEvent: (NSURL *)url;

@end
