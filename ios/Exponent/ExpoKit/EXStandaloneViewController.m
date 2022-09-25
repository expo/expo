// Copyright 2018-present 650 Industries. All rights reserved.

#import "EXStandaloneViewController.h"

@implementation EXStandaloneViewController

- (BOOL)shouldAutorotate
{
  if (self.contentViewController != nil) {
    return [self.contentViewController shouldAutorotate];
  }
  return YES;
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
  if (self.contentViewController != nil) {
    return [self.contentViewController supportedInterfaceOrientations];
  }
  return UIInterfaceOrientationMaskAllButUpsideDown;
}

@end
