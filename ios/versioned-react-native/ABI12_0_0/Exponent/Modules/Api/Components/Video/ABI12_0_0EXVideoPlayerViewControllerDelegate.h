// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <AVKit/AVKit.h>

@protocol ABI12_0_0EXVideoPlayerViewControllerDelegate <NSObject>

- (void)videoPlayerViewControllerWillDismiss:(AVPlayerViewController *)playerViewController;
- (void)videoPlayerViewControllerDidDismiss:(AVPlayerViewController *)playerViewController;

@end
