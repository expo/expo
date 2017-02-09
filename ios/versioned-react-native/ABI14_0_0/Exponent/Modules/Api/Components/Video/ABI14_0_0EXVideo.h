// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI14_0_0/ABI14_0_0RCTView.h>
#import <ReactABI14_0_0/ABI14_0_0RCTBridge.h>
#import <AVFoundation/AVFoundation.h>
#import <AVKit/AVKit.h>
#import "ABI14_0_0UIView+FindUIViewController.h"
#import "ABI14_0_0EXVideoPlayerViewController.h"
#import "ABI14_0_0EXVideoPlayerViewControllerDelegate.h"

@class ABI14_0_0RCTEventDispatcher;

@interface ABI14_0_0EXVideo : UIView <ABI14_0_0EXVideoPlayerViewControllerDelegate>

- (instancetype)initWithBridge:(ABI14_0_0RCTBridge *)bridge;

@end
