// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVKit/AVKit.h>

#import "ABI25_0_0EXVideoPlayerViewControllerDelegate.h"

@interface ABI25_0_0EXVideoPlayerViewController : AVPlayerViewController

@property (nonatomic, weak) id<ABI25_0_0EXVideoPlayerViewControllerDelegate> rctDelegate;

@end
