// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTView.h>
#import <React/RCTBridge.h>
#import <AVFoundation/AVFoundation.h>
#import <AVKit/AVKit.h>
#import "UIView+FindUIViewController.h"
#import "EXVideoPlayerViewController.h"
#import "EXVideoPlayerViewControllerDelegate.h"

@class RCTEventDispatcher;

@interface EXVideo : UIView <EXVideoPlayerViewControllerDelegate>

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@end
