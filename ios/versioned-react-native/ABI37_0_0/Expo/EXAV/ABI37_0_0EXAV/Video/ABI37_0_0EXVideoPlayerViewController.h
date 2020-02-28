// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVKit/AVKit.h>

#import <ABI37_0_0EXAV/ABI37_0_0EXVideoPlayerViewControllerDelegate.h>

@interface ABI37_0_0EXVideoPlayerViewController : AVPlayerViewController

@property (nonatomic, weak) id<ABI37_0_0EXVideoPlayerViewControllerDelegate> rctDelegate;

@end
