// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVKit/AVKit.h>

#import <ABI35_0_0EXAV/ABI35_0_0EXVideoPlayerViewControllerDelegate.h>

@interface ABI35_0_0EXVideoPlayerViewController : AVPlayerViewController

@property (nonatomic, weak) id<ABI35_0_0EXVideoPlayerViewControllerDelegate> rctDelegate;

@end
