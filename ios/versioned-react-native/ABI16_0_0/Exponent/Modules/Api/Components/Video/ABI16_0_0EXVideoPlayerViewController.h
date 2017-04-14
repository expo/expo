// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVKit/AVKit.h>
#import "ABI16_0_0EXVideo.h"
#import "ABI16_0_0EXVideoPlayerViewControllerDelegate.h"

@interface ABI16_0_0EXVideoPlayerViewController : AVPlayerViewController

@property (nonatomic, weak) id<ABI16_0_0EXVideoPlayerViewControllerDelegate> rctDelegate;

@end
