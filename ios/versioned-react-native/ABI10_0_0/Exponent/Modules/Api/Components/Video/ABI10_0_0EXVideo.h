// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI10_0_0RCTView.h"
#import "ABI10_0_0RCTBridge.h"
#import <AVFoundation/AVFoundation.h>
#import <AVKit/AVKit.h>
#import "ABI10_0_0UIView+FindUIViewController.h"
#import "ABI10_0_0EXVideoPlayerViewController.h"
#import "ABI10_0_0EXVideoPlayerViewControllerDelegate.h"

@class ABI10_0_0RCTEventDispatcher;

@interface ABI10_0_0EXVideo : UIView <ABI10_0_0EXVideoPlayerViewControllerDelegate>

- (instancetype)initWithBridge:(ABI10_0_0RCTBridge *)bridge;

@end
