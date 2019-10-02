// Copyright 2015-present 650 Industries. All rights reserved.

#import <AVKit/AVKit.h>

@protocol EXVideoPlayerViewControllerDelegate <NSObject>

- (void)videoPlayerViewControllerWillDismiss:(AVPlayerViewController *)playerViewController;

- (void)videoPlayerViewControllerDidDismiss:(AVPlayerViewController *)playerViewController;

@end
