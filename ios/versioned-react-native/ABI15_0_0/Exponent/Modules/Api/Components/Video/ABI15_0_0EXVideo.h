// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI15_0_0/ABI15_0_0RCTView.h>
#import <ReactABI15_0_0/ABI15_0_0RCTBridge.h>
#import <AVFoundation/AVFoundation.h>
#import <AVKit/AVKit.h>
#import "ABI15_0_0UIView+FindUIViewController.h"
#import "ABI15_0_0EXVideoPlayerViewController.h"
#import "ABI15_0_0EXVideoPlayerViewControllerDelegate.h"

@class ABI15_0_0RCTEventDispatcher;

@interface ABI15_0_0EXVideo : UIView <ABI15_0_0EXVideoPlayerViewControllerDelegate>

- (instancetype)initWithBridge:(ABI15_0_0RCTBridge *)bridge;

@end
