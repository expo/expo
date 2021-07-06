// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTUtils.h>

#import "EXDevMenuMotionInterceptor.h"
#import "EXDevMenuManager.h"

@import UIKit;

static BOOL isInstalled = NO;

@implementation UIWindow (EXDevMenuMotionInterceptor)

- (void)EX_motionEnded:(__unused UIEventSubtype)motion withEvent:(UIEvent *)event
{
  if (event.subtype == UIEventSubtypeMotionShake) {
    [[EXDevMenuManager sharedInstance] toggle];
  }
}

@end

@implementation EXDevMenuMotionInterceptor

+ (void)install
{
  if (!isInstalled) {
    // Capture shake gesture from any window by swapping default implementation from UIWindow.
    RCTSwapInstanceMethods([UIWindow class], @selector(motionEnded:withEvent:), @selector(EX_motionEnded:withEvent:));
    isInstalled = YES;
  }
}

+ (void)uninstall
{
  if (isInstalled) {
    // Bring back the original method.
    RCTSwapInstanceMethods([UIWindow class], @selector(motionEnded:withEvent:), @selector(EX_motionEnded:withEvent:));
    isInstalled = NO;
  }
}

+ (BOOL)isInstalled
{
  return isInstalled;
}

@end
