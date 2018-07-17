// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVKit/AVKit.h>

#import "ABI29_0_0EXVideoPlayerViewControllerDelegate.h"

@interface ABI29_0_0EXVideoPlayerViewController : AVPlayerViewController

@property (nonatomic, weak) id<ABI29_0_0EXVideoPlayerViewControllerDelegate> rctDelegate;

@end
