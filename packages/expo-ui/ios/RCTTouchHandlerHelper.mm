// Copyright 2024-present 650 Industries. All rights reserved.

#import "RCTTouchHandlerHelper.h"
#import <React/RCTSurfaceTouchHandler.h>

@implementation RCTTouchHandlerHelper

+ (nullable UIGestureRecognizer *)createAndAttachTouchHandlerForView:(UIView *)view {
  for (UIGestureRecognizer *recognizer in [view.gestureRecognizers copy]) {
    if ([recognizer isKindOfClass:[RCTSurfaceTouchHandler class]]) {
      return nil;
    }
  }
  RCTSurfaceTouchHandler *touchHandler = [[RCTSurfaceTouchHandler alloc] init];
  [touchHandler attachToView:view];
  return touchHandler;
}

@end
