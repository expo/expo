// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVKit/AVKit.h>

#import <ABI47_0_0EXAV/ABI47_0_0EXVideoPlayerViewControllerDelegate.h>

@interface ABI47_0_0EXVideoPlayerViewController : AVPlayerViewController

@property (nonatomic, weak) id<ABI47_0_0EXVideoPlayerViewControllerDelegate> rctDelegate;

@end
