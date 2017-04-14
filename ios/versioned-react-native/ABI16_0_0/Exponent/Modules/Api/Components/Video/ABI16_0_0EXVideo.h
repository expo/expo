// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI16_0_0/ABI16_0_0RCTView.h>
#import <ReactABI16_0_0/ABI16_0_0RCTBridge.h>
#import <AVFoundation/AVFoundation.h>
#import <AVKit/AVKit.h>
#import "ABI16_0_0UIView+FindUIViewController.h"
#import "ABI16_0_0EXVideoPlayerViewController.h"
#import "ABI16_0_0EXVideoPlayerViewControllerDelegate.h"

@class ABI16_0_0RCTEventDispatcher;

@interface ABI16_0_0EXVideo : UIView <ABI16_0_0EXVideoPlayerViewControllerDelegate>

- (instancetype)initWithBridge:(ABI16_0_0RCTBridge *)bridge;

@end
