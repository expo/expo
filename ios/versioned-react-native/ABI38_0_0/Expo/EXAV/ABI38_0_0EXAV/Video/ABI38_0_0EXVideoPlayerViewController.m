// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXAV/ABI38_0_0EXVideoPlayerViewController.h>

@implementation ABI38_0_0EXVideoPlayerViewController

- (void)viewDidDisappear:(BOOL)animated
{
  [super viewDidDisappear:animated];
  [_rctDelegate videoPlayerViewControllerDidDismiss:self];
}

- (void)viewWillDisappear:(BOOL)animated
{
  [_rctDelegate videoPlayerViewControllerWillDismiss:self];
  [super viewWillDisappear:animated];
}

@end
