// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVKit/AVKit.h>

#import "EXVideoPlayerViewControllerDelegate.h"

@interface EXVideoPlayerViewController : AVPlayerViewController

@property (nonatomic, weak) id<EXVideoPlayerViewControllerDelegate> rctDelegate;

@end
