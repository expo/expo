// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI49_0_0EXAV/ABI49_0_0EXVideoPlayerViewController.h>

@implementation ABI49_0_0EXVideoPlayerViewController

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
