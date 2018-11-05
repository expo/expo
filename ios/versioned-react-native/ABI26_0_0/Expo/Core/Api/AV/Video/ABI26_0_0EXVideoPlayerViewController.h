// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVKit/AVKit.h>

#import "ABI26_0_0EXVideoPlayerViewControllerDelegate.h"

@interface ABI26_0_0EXVideoPlayerViewController : AVPlayerViewController

@property (nonatomic, weak) id<ABI26_0_0EXVideoPlayerViewControllerDelegate> rctDelegate;

@end
