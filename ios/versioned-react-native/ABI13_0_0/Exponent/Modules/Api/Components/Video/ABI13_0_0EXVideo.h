// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI13_0_0/ABI13_0_0RCTView.h>
#import <ReactABI13_0_0/ABI13_0_0RCTBridge.h>
#import <AVFoundation/AVFoundation.h>
#import <AVKit/AVKit.h>
#import "ABI13_0_0UIView+FindUIViewController.h"
#import "ABI13_0_0EXVideoPlayerViewController.h"
#import "ABI13_0_0EXVideoPlayerViewControllerDelegate.h"

@class ABI13_0_0RCTEventDispatcher;

@interface ABI13_0_0EXVideo : UIView <ABI13_0_0EXVideoPlayerViewControllerDelegate>

- (instancetype)initWithBridge:(ABI13_0_0RCTBridge *)bridge;

@end
