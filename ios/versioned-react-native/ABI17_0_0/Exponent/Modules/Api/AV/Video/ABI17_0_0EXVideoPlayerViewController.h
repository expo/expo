// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVKit/AVKit.h>

#import "ABI17_0_0EXVideoPlayerViewControllerDelegate.h"

@interface ABI17_0_0EXVideoPlayerViewController : AVPlayerViewController

@property (nonatomic, weak) id<ABI17_0_0EXVideoPlayerViewControllerDelegate> rctDelegate;

@end
