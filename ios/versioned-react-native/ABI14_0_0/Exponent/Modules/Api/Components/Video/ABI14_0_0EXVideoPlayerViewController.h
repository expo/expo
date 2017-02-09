// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVKit/AVKit.h>
#import "ABI14_0_0EXVideo.h"
#import "ABI14_0_0EXVideoPlayerViewControllerDelegate.h"

@interface ABI14_0_0EXVideoPlayerViewController : AVPlayerViewController

@property (nonatomic, weak) id<ABI14_0_0EXVideoPlayerViewControllerDelegate> rctDelegate;

@end
