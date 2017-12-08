// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVKit/AVKit.h>

#import "ABI24_0_0EXVideoPlayerViewControllerDelegate.h"

@interface ABI24_0_0EXVideoPlayerViewController : AVPlayerViewController

@property (nonatomic, weak) id<ABI24_0_0EXVideoPlayerViewControllerDelegate> rctDelegate;

@end
