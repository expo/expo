// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI11_0_0RCTView.h"
#import "ABI11_0_0RCTBridge.h"
#import <AVFoundation/AVFoundation.h>
#import <AVKit/AVKit.h>
#import "ABI11_0_0UIView+FindUIViewController.h"
#import "ABI11_0_0EXVideoPlayerViewController.h"
#import "ABI11_0_0EXVideoPlayerViewControllerDelegate.h"

@class ABI11_0_0RCTEventDispatcher;

@interface ABI11_0_0EXVideo : UIView <ABI11_0_0EXVideoPlayerViewControllerDelegate>

- (instancetype)initWithBridge:(ABI11_0_0RCTBridge *)bridge;

@end
