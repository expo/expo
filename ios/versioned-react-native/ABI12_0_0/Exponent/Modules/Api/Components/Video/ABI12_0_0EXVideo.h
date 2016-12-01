// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI12_0_0RCTView.h"
#import "ABI12_0_0RCTBridge.h"
#import <AVFoundation/AVFoundation.h>
#import <AVKit/AVKit.h>
#import "ABI12_0_0UIView+FindUIViewController.h"
#import "ABI12_0_0EXVideoPlayerViewController.h"
#import "ABI12_0_0EXVideoPlayerViewControllerDelegate.h"

@class ABI12_0_0RCTEventDispatcher;

@interface ABI12_0_0EXVideo : UIView <ABI12_0_0EXVideoPlayerViewControllerDelegate>

- (instancetype)initWithBridge:(ABI12_0_0RCTBridge *)bridge;

@end
